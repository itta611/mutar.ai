import { generateObject } from "ai"
import sharp from "sharp"
import { z } from "zod"

import { openrouter } from "./openrouter"

type TextBox = {
  align?: "left" | "center" | "right"
  bbox: { x?: number; y?: number }[]
  label: string
}

type Rect = {
  height: number
  left: number
  top: number
  width: number
}

const textStyleSchema = z.object({
  styles: z.array(
    z.object({
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      index: z.number().int().nonnegative(),
    })
  ),
})

function rectFromBox(box: TextBox) {
  const xs = box.bbox.map((vertex) => vertex.x ?? 0)
  const ys = box.bbox.map((vertex) => vertex.y ?? 0)

  if (xs.length === 0 || ys.length === 0) {
    return null
  }

  const left = Math.min(...xs)
  const top = Math.min(...ys)

  return {
    height: Math.max(...ys) - top,
    left,
    top,
    width: Math.max(...xs) - left,
  }
}

function cropRect(rect: Rect, imageWidth: number, imageHeight: number) {
  const padding = Math.max(
    8,
    Math.ceil(Math.max(rect.width, rect.height) * 0.2)
  )
  const left = Math.max(0, Math.floor(rect.left - padding))
  const top = Math.max(0, Math.floor(rect.top - padding))
  const right = Math.min(
    imageWidth,
    Math.ceil(rect.left + rect.width + padding)
  )
  const bottom = Math.min(
    imageHeight,
    Math.ceil(rect.top + rect.height + padding)
  )

  return {
    height: bottom - top,
    left,
    top,
    width: right - left,
  }
}

async function createContactSheet({
  boxes,
  image,
}: {
  boxes: TextBox[]
  image: Buffer
}) {
  const metadata = await sharp(image).metadata()

  if (!metadata.width || !metadata.height) {
    return image
  }

  const tileWidth = 320
  const tileHeight = 180
  const labelHeight = 28
  const gap = 8
  const columns = Math.ceil(Math.sqrt(boxes.length))
  const rows = Math.ceil(boxes.length / columns)
  const sheetWidth = columns * tileWidth + (columns - 1) * gap
  const sheetHeight = rows * tileHeight + (rows - 1) * gap
  const background = boxes
    .map((_, index) => {
      const x = (index % columns) * (tileWidth + gap)
      const y = Math.floor(index / columns) * (tileHeight + gap)

      return [
        `<rect x="${x}" y="${y}" width="${tileWidth}" height="${tileHeight}" fill="#ffffff" stroke="#d9d9d9"/>`,
        `<rect x="${x}" y="${y}" width="${tileWidth}" height="${labelHeight}" fill="#ffffff"/>`,
        `<text x="${x + 8}" y="${y + 20}" font-family="Arial, sans-serif" font-size="18" fill="#000000">${index}</text>`,
      ].join("")
    })
    .join("")
  const composites = (
    await Promise.all(
      boxes.map(async (box, index) => {
        const rect = rectFromBox(box)

        if (!rect) {
          return null
        }

        const crop = cropRect(rect, metadata.width, metadata.height)

        if (crop.width <= 0 || crop.height <= 0) {
          return null
        }

        const input = await sharp(image)
          .extract(crop)
          .resize({
            fit: "inside",
            height: tileHeight - labelHeight - 16,
            width: tileWidth - 16,
          })
          .png()
          .toBuffer()
        const inputMetadata = await sharp(input).metadata()
        const x = (index % columns) * (tileWidth + gap)
        const y = Math.floor(index / columns) * (tileHeight + gap)

        return {
          input,
          left: x + Math.round((tileWidth - (inputMetadata.width ?? 0)) / 2),
          top:
            y +
            labelHeight +
            Math.round(
              (tileHeight - labelHeight - (inputMetadata.height ?? 0)) / 2
            ),
        }
      })
    )
  ).filter((composite) => composite !== null)

  return sharp(
    Buffer.from(
      `<svg width="${sheetWidth}" height="${sheetHeight}" viewBox="0 0 ${sheetWidth} ${sheetHeight}" xmlns="http://www.w3.org/2000/svg">${background}</svg>`
    )
  )
    .composite(composites)
    .png()
    .toBuffer()
}

export async function getTextStyle({
  boxes,
  image,
}: {
  boxes: TextBox[]
  image: Buffer
}) {
  if (boxes.length === 0) {
    return []
  }

  const contactSheet = await createContactSheet({ boxes, image })
  const result = await generateObject({
    model: openrouter.languageModel("google/gemini-2.5-pro", {
      provider: { allow_fallbacks: true },
    }),
    schema: textStyleSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "Return the visible text color for each indexed crop as a hex RGB value.",
              "Ignore the black index labels, white headers, and tile borders.",
              "Return one style for every index.",
              "Use #000000 for black text or when the color cannot be determined.",
              JSON.stringify({
                boxes: boxes.map((box, index) => ({
                  index,
                  label: box.label,
                })),
              }),
            ].join("\n"),
          },
          {
            type: "image",
            image: contactSheet,
          },
        ],
      },
    ],
  })
  const styles = new Map(
    result.object.styles.map((style) => [style.index, style.color])
  )

  return boxes.map((box, index) => ({
    ...box,
    color: styles.get(index) ?? "#000000",
  }))
}
