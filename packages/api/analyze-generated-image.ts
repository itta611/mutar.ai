import vision from "@google-cloud/vision"
import { generateObject } from "ai"
import { z } from "zod"

import { updateProjectAnalysisByUserId } from "@hengen/db/repo"

import { env } from "./env"
import { getTextStyle } from "./get-text-style"
import { openrouter } from "./openrouter"

const visionClient = new vision.ImageAnnotatorClient({
  fallback: true,
  projectId: env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
})

type VisionVertex = {
  x?: number
  y?: number
}

type VisionWord = {
  symbols?: {
    text?: string
  }[]
}

type VisionFullTextAnnotation = {
  pages?: {
    blocks?: {
      paragraphs?: {
        words?: VisionWord[]
      }[]
    }[]
  }[]
}

type OcrWord = {
  bbox: VisionVertex[]
  id: string
  label: string
}

const mergeSchema = z.object({
  groups: z.array(
    z.object({
      align: z.enum(["left", "center", "right"]),
      label: z.string(),
      wordIds: z.array(z.string()),
    })
  ),
})

function rectFromVertices(vertices: VisionVertex[]) {
  const xs = vertices.map((vertex) => vertex.x ?? 0)
  const ys = vertices.map((vertex) => vertex.y ?? 0)
  const left = Math.min(...xs)
  const top = Math.min(...ys)

  return {
    height: Math.max(...ys) - top,
    left,
    top,
    width: Math.max(...xs) - left,
  }
}

function labelFromVisionWord(word: VisionWord) {
  return word.symbols?.map((symbol) => symbol.text ?? "").join("") ?? ""
}

function blocksFromFullText(
  words: OcrWord[],
  fullTextAnnotation: VisionFullTextAnnotation | undefined
) {
  let index = 0
  const blocks =
    fullTextAnnotation?.pages?.flatMap((page) =>
      (page.blocks ?? []).map((block) => ({
        words: Object.fromEntries(
          block.paragraphs?.flatMap(
            (paragraph) =>
              paragraph.words
                ?.map((word) => {
                  const id = words[index]?.id
                  index += 1

                  return id ? [id, labelFromVisionWord(word)] : null
                })
                .filter((word) => word !== null) ?? []
          ) ?? []
        ),
      }))
    ) ?? []

  const nonEmptyBlocks = blocks.filter(
    (block) => Object.keys(block.words).length > 0
  )

  return nonEmptyBlocks.length > 0
    ? nonEmptyBlocks
    : [
        {
          words: Object.fromEntries(words.map(({ id, label }) => [id, label])),
        },
      ]
}

function bboxFromBoxes(boxes: VisionVertex[][]) {
  const vertices = boxes.flat()

  if (vertices.length === 0) {
    return []
  }

  const rect = rectFromVertices(vertices)

  return [
    { x: rect.left, y: rect.top },
    { x: rect.left + rect.width, y: rect.top },
    { x: rect.left + rect.width, y: rect.top + rect.height },
    { x: rect.left, y: rect.top + rect.height },
  ]
}

async function mergeWordsWithAi(options: {
  blocks: { words: Record<string, string> }[]
  image: Buffer
}) {
  const result = await generateObject({
    model: openrouter.languageModel("google/gemini-2.5-pro", {
      provider: { allow_fallbacks: true },
    }),
    schema: mergeSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "Merge OCR words into semantically meaningful labels.",
              "Select text only. Omit decorative fragments, even if OCR detected them as text.",
              "You may also omit words whose surrounding context is unclear or whose position cannot be confidently matched against the image.",
              "Each group must contain words from one visual line only.",
              "Never merge words from different visual lines, even if they form one sentence.",
              "If a paragraph has line breaks, split it into separate groups for each line.",
              "Set align to the group's visual text alignment in the full image: left, center, or right.",
              "Use only the provided word IDs. Do not invent IDs.",
              "Return groups in reading order. Each word ID should appear at most once.",
              "The image is the original generated image for visual reference.",
              JSON.stringify({ blocks: options.blocks }),
            ].join("\n"),
          },
          {
            type: "image",
            image: options.image,
          },
        ],
      },
    ],
  })

  return result.object.groups
}

function mergedBoxesFromGroups(
  groups: z.infer<typeof mergeSchema>["groups"],
  words: OcrWord[]
) {
  const wordMap = new Map(words.map((word) => [word.id, word]))

  return groups
    .map((group) => {
      const groupWords = group.wordIds
        .map((id) => wordMap.get(id))
        .filter((word) => word !== undefined)

      return {
        align: group.align,
        bbox: bboxFromBoxes(groupWords.map((word) => word.bbox)),
        label: group.label,
      }
    })
    .filter((box) => box.bbox.length > 0)
}

export async function analyzeGeneratedImage({
  bytes,
  projectId,
  userId,
}: {
  bytes: Uint8Array
  projectId: string
  userId: string
}) {
  const image = Buffer.from(bytes)
  const [result] = await visionClient.textDetection({
    image: { content: image.toString("base64") },
  })
  const words: OcrWord[] =
    result.textAnnotations?.slice(1).map((annotation, index) => ({
      bbox: (annotation.boundingPoly?.vertices ?? []) as VisionVertex[],
      id: `w${index}`,
      label: annotation.description ?? "",
    })) ?? []
  const groups = await mergeWordsWithAi({
    blocks: blocksFromFullText(
      words,
      result.fullTextAnnotation as VisionFullTextAnnotation | undefined
    ),
    image,
  })
  const boxes = mergedBoxesFromGroups(groups, words)
  const styledBoxes = await getTextStyle({ boxes, image })

  await updateProjectAnalysisByUserId({ boxes: styledBoxes, projectId, userId })
}
