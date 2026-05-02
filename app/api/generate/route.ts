import { NextResponse } from "next/server"
import { z } from "zod"

import {
  updateProjectImageByUserId,
  updateProjectStatusByUserId,
} from "@/db/repo"
import { auth } from "@/lib/auth"
import { uploadImageToR2 } from "@/lib/r2"

import { analyzeGeneratedImage } from "./analyze-generated-image"
import { generatePresentationImage } from "./generate-presentation-image"
import { removeTextFromImage } from "./remove-text-from-image"

export const runtime = "nodejs"
export const maxDuration = 120

const requestSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().trim().min(12).max(1200),
  aspectRatio: z.enum(["16:9", "4:3", "3:4", "1:1"]),
  model: z.enum(["google/gemini-2.5-flash-image", "openai/gpt-5.4-image-2"]),
})

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
      keyPrefix: `projects/${projectId}-original`,
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

    await Promise.all([
      analyzeGeneratedImage({
        bytes: generated.image.uint8Array,
        height: generated.dimensions.height,
        projectId,
        userId: session.user.id,
        width: generated.dimensions.width,
      }),
      removeTextFromImage({
        bytes: generated.image.uint8Array,
        mediaType: generated.image.mediaType,
        projectId,
        userId: session.user.id,
      }),
    ])

    await updateProjectStatusByUserId({
      projectId,
      status: "ready",
      userId: session.user.id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    await updateProjectStatusByUserId({
      projectId,
      status: "error",
      userId: session.user.id,
    })
    console.error("[hengen] failed to generate project", error)
    return NextResponse.json(
      { message: "Failed to generate project" },
      { status: 500 }
    )
  }
}
