import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/db"
import { projects, textBoxes } from "@/db/schema"
import { auth } from "@/lib/auth"
import { isEditorFontName, normalizeEditorFont } from "@/lib/fonts"

export const runtime = "nodejs"

const boxSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1).max(5000),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.02).max(1),
  height: z.number().min(0.02).max(1),
  fontFamily: z.string().refine(isEditorFontName),
  fontSize: z.number().int().min(12).max(160),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
})

const requestSchema = z.object({
  boxes: z.array(boxSchema).max(40),
})

export async function PATCH(
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

  const { boxes } = parsedBody.data

  const [project] = await db
    .select({
      id: projects.id,
    })
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
    )
    .limit(1)

  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  const existingBoxes = await db
    .select({
      id: textBoxes.id,
    })
    .from(textBoxes)
    .where(eq(textBoxes.projectId, projectId))

  const existingBoxIds = new Set(existingBoxes.map((box) => box.id))
  const hasUnknownBox = boxes.some((box) => !existingBoxIds.has(box.id))

  if (hasUnknownBox) {
    return NextResponse.json({ message: "Invalid text box" }, { status: 400 })
  }

  const submittedBoxIds = new Set(boxes.map((box) => box.id))
  const removedBoxIds = existingBoxes
    .map((box) => box.id)
    .filter((id) => !submittedBoxIds.has(id))

  for (const box of boxes) {
    await db
      .update(textBoxes)
      .set({
        content: box.content,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        fontFamily: normalizeEditorFont(box.fontFamily),
        fontSize: box.fontSize,
        color: box.color,
        updatedAt: new Date(),
      })
      .where(and(eq(textBoxes.id, box.id), eq(textBoxes.projectId, projectId)))
  }

  for (const id of removedBoxIds) {
    await db
      .delete(textBoxes)
      .where(and(eq(textBoxes.id, id), eq(textBoxes.projectId, projectId)))
  }

  await db
    .update(projects)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))

  return NextResponse.json({ ok: true })
}
