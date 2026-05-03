import { generateImage as generateAiImage } from "ai"

import { getImageDimensions } from "@/lib/image-dimensions"

import { openrouter } from "./openrouter"

export type AspectRatio = "16:9" | "4:3" | "3:4" | "1:1"
type ImageModel = "google/gemini-2.5-flash-image" | "openai/gpt-5.4-image-2"

export async function generateImage(
  prompt: string,
  aspectRatio: AspectRatio,
  selectedModel: ImageModel
) {
  const result = await generateAiImage({
    model: openrouter.imageModel(selectedModel, {
      provider: {
        allow_fallbacks: true,
      },
    }),
    aspectRatio,
    prompt: [
      "Create a polished informational material, such as a slide or poster.",
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
