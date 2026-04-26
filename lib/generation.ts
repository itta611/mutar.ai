import { generateImage } from "ai"

import { detectTextBoxes } from "@/lib/gemini"
import { env } from "@/lib/env"
import { getImageDimensions } from "@/lib/image-dimensions"
import { openrouter } from "@/lib/openrouter"

const imageModel = openrouter.imageModel(env.OPENROUTER_IMAGE_MODEL, {
  provider: {
    order: ["openai"],
    allow_fallbacks: true,
  },
})

async function generatePresentationImage(prompt: string) {
  const result = await generateImage({
    model: imageModel,
    aspectRatio: "4:3",
    prompt: [
      "Create a presentation-ready visual for slides or posters.",
      "Use a calm, premium, editorial style with strong layout discipline.",
      "Include clear, realistic typography and hierarchy directly in the image.",
      "The output should feel like it was made by a senior designer, not clip art.",
      `User brief: ${prompt}`,
    ].join(" "),
  })

  return result.image
}

async function removeEmbeddedText(options: {
  prompt: string
  image: Uint8Array
  mediaType: string
  analysisSummary: string
}) {
  const result = await generateImage({
    model: imageModel,
    aspectRatio: "4:3",
    prompt: {
      images: [options.image],
      text: [
        "Use the input image as a strict layout and composition reference.",
        "Remove every visible piece of text, lettering, number, glyph, and logo.",
        "Preserve the original illustration, lighting, atmosphere, colors, spacing, and empty space.",
        "Do not add new text.",
        options.analysisSummary
          ? `The removed text roughly contains: ${options.analysisSummary}.`
          : "",
        `Original brief: ${options.prompt}`,
      ]
        .filter(Boolean)
        .join(" "),
    },
  })

  return result.image
}

export async function runGenerationPipeline(prompt: string) {
  const originalImage = await generatePresentationImage(prompt)
  const dimensions = getImageDimensions(
    originalImage.uint8Array,
    originalImage.mediaType
  )

  const analysis = await detectTextBoxes({
    image: originalImage.uint8Array,
    mediaType: originalImage.mediaType,
    width: dimensions.width,
    height: dimensions.height,
  }).catch(() => ({
    summary: "",
    boxes: [],
  }))

  const cleanedImage = await removeEmbeddedText({
    prompt,
    image: originalImage.uint8Array,
    mediaType: originalImage.mediaType,
    analysisSummary: analysis.summary,
  }).catch(() => originalImage)

  return {
    analysis,
    dimensions,
    originalImage,
    cleanedImage,
  }
}
