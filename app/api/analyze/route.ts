import vision from "@google-cloud/vision"
import { NextResponse } from "next/server"
import { z } from "zod"

import { findProjectImageKeysByUserId } from "@/db/repo"
import { env } from "@/lib/env"
import { readImageFromR2 } from "@/lib/r2"
import { getServerSession } from "@/lib/session"

export const runtime = "nodejs"

const visionClient = new vision.ImageAnnotatorClient({
  fallback: true,
  projectId: env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
})

const requestSchema = z.object({
  imageId: z.string().min(1),
})

type VisionVertex = {
  x?: number
  y?: number
}

export async function POST(request: Request) {
  const session = await getServerSession()

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

  const project = await findProjectImageKeysByUserId({
    projectId: parsedBody.data.imageId,
    userId: session.user.id,
  })

  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  try {
    const image = await readImageFromR2(project.originalImageKey)
    const [result] = await visionClient.textDetection({
      image: { content: Buffer.from(image.bytes).toString("base64") },
    })

    const words =
      result.textAnnotations?.slice(1).map((annotation) => ({
        label: annotation.description ?? "",
        bbox: (annotation.boundingPoly?.vertices ?? []) as VisionVertex[],
      })) ?? []

    return NextResponse.json({ boxes: words })
  } catch (error) {
    console.error("[hengen] failed to analyze image", error)
    return NextResponse.json(
      { message: "Failed to analyze image" },
      { status: 500 }
    )
  }
}
