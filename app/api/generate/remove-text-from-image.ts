import { generateImage } from "ai"

import { updateProjectCleanedImageByUserId } from "@/db/repo"
import { uploadImageToR2 } from "@/lib/r2"

import { openrouter } from "./openrouter"

export async function removeTextFromImage({
  bytes,
  mediaType,
  projectId,
  userId,
}: {
  bytes: Uint8Array
  mediaType: string
  projectId: string
  userId: string
}) {
  const result = await generateImage({
    model: openrouter.imageModel("google/gemini-3-pro-image-preview", {
      provider: { allow_fallbacks: true },
    }),
    prompt: {
      images: [bytes],
      text: [
        "Remove only the visible text from this image.",
        "Preserve the original layout, background, objects, colors, and composition.",
        "Do not add replacement text.",
      ].join(" "),
    },
  })

  const cleanedImageKey = await uploadImageToR2({
    keyPrefix: `projects/${projectId}-cleaned`,
    bytes: result.image.uint8Array,
    mediaType: result.image.mediaType || mediaType,
  })

  await updateProjectCleanedImageByUserId({
    cleanedImageKey,
    projectId,
    userId,
  })
}
