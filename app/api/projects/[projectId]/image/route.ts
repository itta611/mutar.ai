import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { db } from "@/db"
import { projects } from "@/db/schema"
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
  const variant = new URL(request.url).searchParams.get("variant") ?? "cleaned"

  if (variant !== "cleaned" && variant !== "original") {
    return NextResponse.json({ message: "Invalid variant" }, { status: 400 })
  }

  const [project] = await db
    .select({
      originalImageKey: projects.originalImageKey,
      cleanedImageKey: projects.cleanedImageKey,
    })
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
    )
    .limit(1)

  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  const key =
    variant === "original"
      ? project.originalImageKey
      : (project.cleanedImageKey ?? project.originalImageKey)

  let asset: Awaited<ReturnType<typeof readImageFromR2>>

  try {
    asset = await readImageFromR2(key)
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
      "Cache-Control": "private, max-age=3600",
    },
  })
}
