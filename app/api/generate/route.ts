import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"
import { z } from "zod"

import { createProject, findProjectDimensionsByUserId } from "@/db/repo"
import { auth } from "@/lib/auth"
import { generatePresentationImage } from "@/lib/generation"
import { uploadImageToR2 } from "@/lib/r2"

export const runtime = "nodejs"
export const maxDuration = 120

const requestSchema = z.object({
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

  const { prompt, aspectRatio, model } = parsedBody.data

  const projectId = randomUUID()

  try {
    const generated = await generatePresentationImage(
      prompt,
      aspectRatio,
      model
    )
    const originalImageKey = await uploadImageToR2({
      keyPrefix: `projects/${randomUUID()}`,
      bytes: generated.image.uint8Array,
      mediaType: generated.image.mediaType,
    })

    await createProject({
      id: projectId,
      userId: session.user.id,
      prompt,
      status: "ready",
      originalImageKey,
      width: generated.dimensions.width,
      height: generated.dimensions.height,
      analysis: { summary: "", boxes: [] },
    })

    const project = await findProjectDimensionsByUserId({
      projectId,
      userId: session.user.id,
    })

    return NextResponse.json({
      projectId: project?.id ?? projectId,
      width: project?.width ?? generated.dimensions.width,
      height: project?.height ?? generated.dimensions.height,
    })
  } catch (error) {
    console.error("[hengen] failed to generate project", error)
    return NextResponse.json(
      { message: "Failed to generate project" },
      { status: 500 }
    )
  }
}
