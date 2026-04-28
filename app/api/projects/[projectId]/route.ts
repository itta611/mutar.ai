import { NextResponse } from "next/server"
import { z } from "zod"

import {
  deleteTextBoxById,
  findProjectIdByUserId,
  listTextBoxIdsByProjectId,
  touchProject,
  updateTextBox,
} from "@/db/repo"
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

  const project = await findProjectIdByUserId({
    projectId,
    userId: session.user.id,
  })

  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  const existingBoxes = await listTextBoxIdsByProjectId(projectId)

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
    await updateTextBox({
      ...box,
      projectId,
      fontFamily: normalizeEditorFont(box.fontFamily),
    })
  }

  for (const id of removedBoxIds) {
    await deleteTextBoxById({ id, projectId })
  }

  await touchProject(projectId)

  return NextResponse.json({ ok: true })
}
