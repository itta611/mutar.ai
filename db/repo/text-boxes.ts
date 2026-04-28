import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { textBoxes } from "@/db/schema"

type UpdateTextBoxInput = {
  id: string
  projectId: string
  content: string
  x: number
  y: number
  width: number
  height: number
  fontFamily: string
  fontSize: number
  color: string
}

export async function listTextBoxIdsByProjectId(projectId: string) {
  return db
    .select({
      id: textBoxes.id,
    })
    .from(textBoxes)
    .where(eq(textBoxes.projectId, projectId))
}

export async function updateTextBox(input: UpdateTextBoxInput) {
  await db
    .update(textBoxes)
    .set({
      content: input.content,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      fontFamily: input.fontFamily,
      fontSize: input.fontSize,
      color: input.color,
      updatedAt: new Date(),
    })
    .where(
      and(eq(textBoxes.id, input.id), eq(textBoxes.projectId, input.projectId))
    )
}

export async function deleteTextBoxById({
  id,
  projectId,
}: {
  id: string
  projectId: string
}) {
  await db
    .delete(textBoxes)
    .where(and(eq(textBoxes.id, id), eq(textBoxes.projectId, projectId)))
}
