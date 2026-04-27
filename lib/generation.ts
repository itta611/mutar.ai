import { generateImage } from "ai"

import { getImageDimensions } from "@/lib/image-dimensions"
import { openrouter } from "@/lib/openrouter"

const imageModels = {
  Gemini: "google/gemini-2.5-flash-image",
  "GPT-image-2.0": "openai/gpt-5.4-image-2",
} as const

export type ImageModel = keyof typeof imageModels

export async function generatePresentationImage(
  prompt: string,
  selectedModel: ImageModel
) {
  const result = await generateImage({
    model: openrouter.imageModel(imageModels[selectedModel], {
      provider: {
        allow_fallbacks: true,
      },
    }),
    aspectRatio: "4:3",
    prompt: [
      "Create a presentation-ready visual for slides or posters.",
      "Use a calm, premium, editorial style with strong layout discipline.",
      "Include clear, realistic typography and hierarchy directly in the image.",
      "The output should feel like it was made by a senior designer, not clip art.",
      `User brief: ${prompt}`,
    ].join(" "),
  })

  const dimensions = getImageDimensions(
    result.image.uint8Array,
    result.image.mediaType
  )

  return {
    dimensions,
    image: result.image,
  }
}
