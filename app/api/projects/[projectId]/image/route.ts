import { NextResponse } from "next/server"

import { findProjectCleanedImageKeyByUserId } from "@/db/repo"
import { auth } from "@/lib/auth"
import { readImageFromR2 } from "@/lib/r2"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const project = await findProjectCleanedImageKeyByUserId({
    projectId,
    userId: session.user.id,
  })

  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  if (!project.cleanedImageKey) {
    return NextResponse.json(
      { message: "Image not available" },
      { status: 404, headers: { "Cache-Control": "private, no-store" } }
    )
  }

  let asset: Awaited<ReturnType<typeof readImageFromR2>>

  try {
    asset = await readImageFromR2(project.cleanedImageKey)
  } catch (error) {
    console.error("[hengen] failed to read project image", error)
    return NextResponse.json(
      { message: "Image not available" },
      { status: 502 }
    )
  }

  const body = new ArrayBuffer(asset.bytes.byteLength)
  new Uint8Array(body).set(asset.bytes)

  return new Response(body, {
    headers: {
      "Content-Type": asset.mediaType,
      "Cache-Control": "private, no-store",
    },
  })
}
