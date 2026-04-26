import { generateObject } from "ai"
import { z } from "zod"

import { env } from "@/lib/env"
import { editorFonts } from "@/lib/fonts"
import { openrouter } from "@/lib/openrouter"

const fontOptions = editorFonts.map((font) => font.value) as [
  string,
  ...string[],
]

const textBoxSchema = z.object({
  text: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  fontFamily: z.enum(fontOptions),
  fontSize: z.number(),
})

const analysisSchema = z.object({
  summary: z.string(),
  boxes: z.array(textBoxSchema).max(20),
})

export type DetectedTextBox = z.infer<typeof textBoxSchema>

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export async function detectTextBoxes(input: {
  image: Uint8Array
  mediaType: string
  width: number
  height: number
}) {
  const { object } = await generateObject({
    model: openrouter.chat(env.OPENROUTER_TEXT_MODEL, {
      provider: {
        order: ["google"],
        allow_fallbacks: true,
      },
    }),
    schema: analysisSchema,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "You are analyzing an AI-generated slide or poster image.",
              "Detect each visible text region that a human would want to edit later.",
              "Return x, y, width, and height as top-left normalized coordinates between 0 and 1.",
              "Group contiguous words or lines that belong to the same visual text block into one box.",
              "Do not split individual letters or decorative fragments into separate boxes.",
              "Estimate fontFamily using only one of these labels: Manrope, Cormorant Garamond, IBM Plex Sans, Source Serif 4.",
              `Estimate fontSize in pixels for the native ${input.width}x${input.height} image, not for the browser display size.`,
              "Do not invent boxes for decorative shapes that contain no text.",
            ].join(" "),
          },
          {
            type: "image",
            image: input.image,
            mediaType: input.mediaType,
          },
        ],
      },
    ],
  })

  return {
    summary: object.summary,
    boxes: object.boxes
      .map((box) => ({
        ...box,
        x: clamp(box.x, 0, 0.96),
        y: clamp(box.y, 0, 0.96),
        width: clamp(box.width, 0.04, 1),
        height: clamp(box.height, 0.03, 1),
        fontSize: Math.round(
          clamp(box.fontSize, 10, Math.max(24, input.height * 0.16))
        ),
      }))
      .filter((box) => box.text.trim().length > 0)
      .sort((left, right) => left.y - right.y || left.x - right.x),
  }
}
