import { generateImage } from "ai"

import { getImageDimensions } from "@/lib/image-dimensions"
import { openrouter } from "@/lib/openrouter"

export type ImageModel =
  | "google/gemini-2.5-flash-image"
  | "openai/gpt-5.4-image-2"

export async function generatePresentationImage(
  prompt: string,
  aspectRatio: "16:9" | "4:3" | "3:4" | "1:1",
  selectedModel: ImageModel
) {
  const result = await generateImage({
    model: openrouter.imageModel(selectedModel, {
      provider: {
        allow_fallbacks: true,
      },
    }),
    aspectRatio,
    prompt: [
      "Create a presentation-ready visual for slides or posters.",
      "Use a calm, premium, editorial style with strong layout discipline.",
      "Include clear, realistic typography and hierarchy directly in the image.",
      "The output should feel like it was made by a senior designer, not clip art.",
      `User brief: ${prompt}`,
      `Make the aspect ratio ${aspectRatio}`,
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
