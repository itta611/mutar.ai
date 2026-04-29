import vision from "@google-cloud/vision"
import { NextResponse } from "next/server"
import sharp from "sharp"
import { z } from "zod"

import { findProjectImageKeysByUserId } from "@/db/repo"
import { env } from "@/lib/env"
import { getImageDimensions } from "@/lib/image-dimensions"
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

function rectFromVertices(vertices: VisionVertex[]) {
  const xs = vertices.map((vertex) => vertex.x ?? 0)
  const ys = vertices.map((vertex) => vertex.y ?? 0)
  const left = Math.min(...xs)
  const top = Math.min(...ys)

  return {
    height: Math.max(...ys) - top,
    left,
    top,
    width: Math.max(...xs) - left,
  }
}

function createOverlaySvg(options: {
  boxes: VisionVertex[][]
  height: number
  width: number
}) {
  const rects = options.boxes
    .filter((box) => box.length > 0)
    .map((box) => {
      const rect = rectFromVertices(box)
      return `<rect x="${rect.left}" y="${rect.top}" width="${rect.width}" height="${rect.height}" fill="rgba(0, 209, 255, 0.12)" stroke="#00d1ff" stroke-width="3"/>`
    })
    .join("")

  return `<svg width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
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

    const boxes =
      result.textAnnotations
        ?.slice(1)
        .map(
          (annotation) =>
            (annotation.boundingPoly?.vertices ?? []) as VisionVertex[]
        ) ?? []

    const dimensions = getImageDimensions(image.bytes, image.mediaType)
    const overlay = createOverlaySvg({
      boxes,
      height: dimensions.height,
      width: dimensions.width,
    })
    const rendered = await sharp(Buffer.from(image.bytes))
      .composite([{ input: Buffer.from(overlay) }])
      .png()
      .toBuffer()
    const body = new ArrayBuffer(rendered.byteLength)
    new Uint8Array(body).set(rendered)

    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "image/png",
      },
    })
  } catch (error) {
    console.error("[hengen] failed to analyze image", error)
    return NextResponse.json(
      { message: "Failed to analyze image" },
      { status: 500 }
    )
  }
}
