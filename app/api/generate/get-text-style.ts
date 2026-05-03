import { generateObject } from "ai"
import { z } from "zod"

import { env } from "@/lib/env"

import { openrouter } from "./openrouter"

type TextBox = {
  bbox: { x?: number; y?: number }[]
  label: string
}

const textStyleSchema = z.object({
  styles: z.array(
    z.object({
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      index: z.number().int().nonnegative(),
    })
  ),
})

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
              "Return the visible text color for each box as a hex RGB value.",
              "Use the bbox coordinates and label to match each box to the image.",
              "Use #000000 only when the color cannot be determined.",
              JSON.stringify({
                boxes: boxes.map((box, index) => ({ ...box, index })),
              }),
            ].join("\n"),
          },
          {
            type: "image",
            image,
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
