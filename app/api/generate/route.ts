import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateImage } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

import { updateProjectImageByUserId } from "@/db/repo"
import { auth } from "@/lib/auth"
import { env } from "@/lib/env"
import { getImageDimensions } from "@/lib/image-dimensions"
import { uploadImageToR2 } from "@/lib/r2"

export const runtime = "nodejs"
export const maxDuration = 120

const requestSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().trim().min(12).max(1200),
  aspectRatio: z.enum(["16:9", "4:3", "3:4", "1:1"]),
  model: z.enum(["google/gemini-2.5-flash-image", "openai/gpt-5.4-image-2"]),
})

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
  appName: "Hengen",
  appUrl: env.NEXT_PUBLIC_BETTER_AUTH_URL,
  compatibility: "strict",
})

async function generatePresentationImage(
  prompt: string,
  aspectRatio: "16:9" | "4:3" | "3:4" | "1:1",
  selectedModel: "google/gemini-2.5-flash-image" | "openai/gpt-5.4-image-2"
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

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

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

  const { projectId, prompt, aspectRatio, model } = parsedBody.data

  try {
    const generated = await generatePresentationImage(
      prompt,
      aspectRatio,
      model
    )
    const originalImageKey = await uploadImageToR2({
      keyPrefix: `projects/${projectId}`,
      bytes: generated.image.uint8Array,
      mediaType: generated.image.mediaType,
    })

    const project = await updateProjectImageByUserId({
      projectId,
      userId: session.user.id,
      originalImageKey,
      width: generated.dimensions.width,
      height: generated.dimensions.height,
    })

    if (!project) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    return NextResponse.json({
      projectId,
      width: generated.dimensions.width,
      height: generated.dimensions.height,
    })
  } catch (error) {
    console.error("[hengen] failed to generate project", error)
    return NextResponse.json(
      { message: "Failed to generate project" },
      { status: 500 }
    )
  }
}
