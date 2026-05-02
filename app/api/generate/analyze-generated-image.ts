import vision from "@google-cloud/vision"
import { generateObject } from "ai"
import sharp from "sharp"
import { z } from "zod"

import { updateProjectAnalysisByUserId } from "@/db/repo"
import { env } from "@/lib/env"

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

type Rect = {
  height: number
  left: number
  top: number
  width: number
}

type OcrWord = {
  bbox: VisionVertex[]
  color: string
  id: string
  label: string
}

const wordStrokeWidth = 3

const mergeSchema = z.object({
  groups: z.array(
    z.object({
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

function expandRect(
  rect: Rect,
  padding: number,
  width: number,
  height: number
) {
  const left = Math.max(0, rect.left - padding)
  const top = Math.max(0, rect.top - padding)
  const right = Math.min(width, rect.left + rect.width + padding)
  const bottom = Math.min(height, rect.top + rect.height + padding)

  return {
    height: bottom - top,
    left,
    top,
    width: right - left,
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

function hexFromRgb({ b, g, r }: { b: number; g: number; r: number }) {
  return `#${[r, g, b]
    .map((value) => Math.round(value).toString(16).padStart(2, "0"))
    .join("")}`
}

function colorDistance(
  a: { b: number; g: number; r: number },
  b: { b: number; g: number; r: number }
) {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
}

function textColorFromBox({
  bbox,
  data,
  height,
  width,
}: {
  bbox: VisionVertex[]
  data: Buffer
  height: number
  width: number
}) {
  if (bbox.length === 0) {
    return "#000000"
  }

  const rect = rectFromVertices(bbox)
  const left = Math.max(0, Math.floor(rect.left))
  const top = Math.max(0, Math.floor(rect.top))
  const right = Math.min(width, Math.ceil(rect.left + rect.width))
  const bottom = Math.min(height, Math.ceil(rect.top + rect.height))
  const colors: { b: number; g: number; r: number }[] = []
  const border: { b: number; g: number; r: number }[] = []

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const index = (y * width + x) * 4
      const color = {
        r: data[index] ?? 0,
        g: data[index + 1] ?? 0,
        b: data[index + 2] ?? 0,
      }

      colors.push(color)

      if (x === left || x === right - 1 || y === top || y === bottom - 1) {
        border.push(color)
      }
    }
  }

  if (colors.length === 0) {
    return "#000000"
  }

  const background = (border.length > 0 ? border : colors).reduce(
    (sum, color) => ({
      r: sum.r + color.r,
      g: sum.g + color.g,
      b: sum.b + color.b,
    }),
    { r: 0, g: 0, b: 0 }
  )
  background.r /= border.length || colors.length
  background.g /= border.length || colors.length
  background.b /= border.length || colors.length

  const maxDistance = Math.max(
    ...colors.map((color) => colorDistance(color, background))
  )
  const textColors = colors.filter(
    (color) => colorDistance(color, background) >= maxDistance * 0.65
  )
  const textColor = (textColors.length > 0 ? textColors : colors).reduce(
    (sum, color) => ({
      r: sum.r + color.r,
      g: sum.g + color.g,
      b: sum.b + color.b,
    }),
    { r: 0, g: 0, b: 0 }
  )

  textColor.r /= textColors.length || colors.length
  textColor.g /= textColors.length || colors.length
  textColor.b /= textColors.length || colors.length

  return hexFromRgb(textColor)
}

async function mergeWordsWithAi(options: {
  blocks: { words: Record<string, string> }[]
  image: Buffer
}) {
  const result = await generateObject({
    model: openrouter.languageModel(env.OPENROUTER_TEXT_MODEL, {
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
              "Use only the provided word IDs. Do not invent IDs.",
              "Return groups in reading order. Each word ID should appear at most once.",
              "The image shows the OCR word boxes for visual reference.",
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
        bbox: bboxFromBoxes(groupWords.map((word) => word.bbox)),
        color: groupWords[0]?.color ?? "#000000",
        label: group.label,
      }
    })
    .filter((box) => box.bbox.length > 0)
}

function createOverlaySvg(options: {
  height: number
  wordBoxes: VisionVertex[][]
  width: number
}) {
  const wordRects = options.wordBoxes
    .filter((box) => box.length > 0)
    .map((box) => {
      const rect = expandRect(
        rectFromVertices(box),
        wordStrokeWidth,
        options.width,
        options.height
      )
      return `<rect x="${rect.left}" y="${rect.top}" width="${rect.width}" height="${rect.height}" fill="rgba(0, 209, 255, 0.12)" stroke="#00d1ff" stroke-width="${wordStrokeWidth}"/>`
    })
    .join("")

  return `<svg width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" xmlns="http://www.w3.org/2000/svg">${wordRects}</svg>`
}

export async function analyzeGeneratedImage({
  bytes,
  height,
  projectId,
  userId,
  width,
}: {
  bytes: Uint8Array
  height: number
  projectId: string
  userId: string
  width: number
}) {
  const image = Buffer.from(bytes)
  const rawImage = await sharp(image).ensureAlpha().raw().toBuffer()
  const [result] = await visionClient.textDetection({
    image: { content: image.toString("base64") },
  })
  const words: OcrWord[] =
    result.textAnnotations?.slice(1).map((annotation, index) => ({
      bbox: (annotation.boundingPoly?.vertices ?? []) as VisionVertex[],
      color: textColorFromBox({
        bbox: (annotation.boundingPoly?.vertices ?? []) as VisionVertex[],
        data: rawImage,
        height,
        width,
      }),
      id: `w${index}`,
      label: annotation.description ?? "",
    })) ?? []
  const overlay = createOverlaySvg({
    height,
    wordBoxes: words.map((word) => word.bbox),
    width,
  })
  const rendered = await sharp(image)
    .composite([{ input: Buffer.from(overlay) }])
    .png()
    .toBuffer()
  const groups = await mergeWordsWithAi({
    blocks: blocksFromFullText(
      words,
      result.fullTextAnnotation as VisionFullTextAnnotation | undefined
    ),
    image: rendered,
  })
  const boxes = mergedBoxesFromGroups(groups, words)

  await updateProjectAnalysisByUserId({ boxes, projectId, userId })
}
