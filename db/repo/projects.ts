import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { projects } from "@/db/schema"

type CreateProjectInput = {
  id: string
  userId: string
  prompt: string
  status: string
  originalImageKey: string
  width: number
  height: number
  analysis: { boxes: unknown[]; summary: string }
}

export async function createProject(input: CreateProjectInput) {
  await db.insert(projects).values(input)
}

export async function findProjectDimensionsByUserId({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const [project] = await db
    .select({
      id: projects.id,
      width: projects.width,
      height: projects.height,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  return project
}

export async function findProjectImageKeysByUserId({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const [project] = await db
    .select({
      originalImageKey: projects.originalImageKey,
      cleanedImageKey: projects.cleanedImageKey,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  return project
}

export async function findProjectForEditorByUserId({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const [project] = await db
    .select({
      id: projects.id,
      prompt: projects.prompt,
      width: projects.width,
      height: projects.height,
      analysis: projects.analysis,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  return project
}

export async function listGeneratedImagesByUserId(userId: string) {
  return db
    .select({
      id: projects.id,
      width: projects.width,
      height: projects.height,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt))
}

export async function deleteProjectByUserId({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const [project] = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning({ id: projects.id })

  return project
}
