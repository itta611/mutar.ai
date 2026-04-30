import vision from "@google-cloud/vision"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateObject } from "ai"
import { NextResponse } from "next/server"
import sharp from "sharp"
import { z } from "zod"

import { findProjectImageKeysByUserId } from "@/db/repo"
import { env } from "@/lib/env"
import { getImageDimensions } from "@/lib/image-dimensions"
import { readImageFromR2 } from "@/lib/r2"
import { getServerSession } from "@/lib/session"

export const runtime = "nodejs"
export const maxDuration = 120

const visionClient = new vision.ImageAnnotatorClient({
  fallback: true,
  projectId: env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
})

const requestSchema = z.object({
  imageId: z.string().min(1),
})

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
  appName: "Hengen",
  appUrl: env.NEXT_PUBLIC_BETTER_AUTH_URL,
  compatibility: "strict",
})

type VisionVertex = {
  x?: number
  y?: number
}

type VisionWord = {
  boundingBox?: {
    vertices?: VisionVertex[]
  }
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

const wordStrokeWidth = 3

const mergeSchema = z.object({
  groups: z.array(
    z.object({
      label: z.string(),
      wordIds: z.array(z.string()),
    })
  ),
})

type OcrWord = {
  bbox: VisionVertex[]
  id: string
  label: string
}

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
    fullTextAnnotation?.pages?.flatMap((page, pageIndex) =>
      (page.blocks ?? []).map((block, blockIndex) => ({
        id: `b${pageIndex}-${blockIndex}`,
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
          id: "b0",
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
  blocks: { id: string; words: Record<string, string> }[]
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

export async function POST(request: Request) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = requestSchema.safeParse(body)

  if (!parsedBody.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 })
  }

  const project = await findProjectImageKeysByUserId({
    projectId: parsedBody.data.imageId,
    userId: session.user.id,
  })

  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  try {
    const image = await readImageFromR2(project.originalImageKey)
    const [result] = await visionClient.textDetection({
      image: { content: Buffer.from(image.bytes).toString("base64") },
    })

    const words: OcrWord[] =
      result.textAnnotations?.slice(1).map((annotation, index) => ({
        bbox: (annotation.boundingPoly?.vertices ?? []) as VisionVertex[],
        id: `w${index}`,
        label: annotation.description ?? "",
      })) ?? []

    const dimensions = getImageDimensions(image.bytes, image.mediaType)
    const overlay = createOverlaySvg({
      height: dimensions.height,
      wordBoxes: words.map((word) => word.bbox),
      width: dimensions.width,
    })
    const rendered = await sharp(Buffer.from(image.bytes))
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

    return NextResponse.json({ boxes: mergedBoxesFromGroups(groups, words) })
  } catch (error) {
    console.error("[hengen] failed to analyze image", error)
    return NextResponse.json(
      { message: "Failed to analyze image" },
      { status: 500 }
    )
  }
}
