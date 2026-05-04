import { after, NextResponse } from "next/server"
import { z } from "zod"

import {
  findProjectDimensionsByUserId,
  updateProjectImageByUserId,
  updateProjectStatusByUserId,
} from "@/db/repo"
import { auth } from "@/lib/auth"
import { uploadImageToR2 } from "@/lib/r2"

import { analyzeGeneratedImage } from "./analyze-generated-image"
import { generateImage } from "./generate-image"
import { removeTextFromImage } from "./remove-text-from-image"

export const runtime = "nodejs"
export const maxDuration = 300

const requestSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().trim().min(12).max(1200),
  aspectRatio: z.enum(["16:9", "4:3", "3:4", "1:1"]),
  model: z.enum(["google/gemini-2.5-flash-image", "openai/gpt-5.4-image-2"]),
})

async function runGenerateJob({
  aspectRatio,
  model,
  projectId,
  prompt,
  userId,
}: z.infer<typeof requestSchema> & { userId: string }) {
  try {
    const generated = await generateImage(prompt, aspectRatio, model)
    const originalImageKey = await uploadImageToR2({
      keyPrefix: `projects/${projectId}-original`,
      bytes: generated.image.uint8Array,
      mediaType: generated.image.mediaType,
    })

    const project = await updateProjectImageByUserId({
      projectId,
      userId,
      originalImageKey,
      width: generated.dimensions.width,
      height: generated.dimensions.height,
    })

    if (!project) {
      return
    }

    await updateProjectStatusByUserId({
      projectId,
      status: "analyzing",
      userId,
    })

    await Promise.all([
      analyzeGeneratedImage({
        bytes: generated.image.uint8Array,
        projectId,
        userId,
      }),
      removeTextFromImage({
        aspectRatio,
        bytes: generated.image.uint8Array,
        mediaType: generated.image.mediaType,
        projectId,
        userId,
      }),
    ])

    await updateProjectStatusByUserId({
      projectId,
      status: "ready",
      userId,
    })
  } catch (error) {
    await updateProjectStatusByUserId({
      projectId,
      status: "error",
      userId,
    })
    console.error("[hengen] failed to generate project", error)
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
  const project = await findProjectDimensionsByUserId({
    projectId,
    userId: session.user.id,
  })

  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  after(() =>
    runGenerateJob({
      prompt,
      aspectRatio,
      projectId,
      model,
      userId: session.user.id,
    })
  )

  return NextResponse.json({ ok: true })
}
