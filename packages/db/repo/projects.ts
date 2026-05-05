import { and, desc, eq } from "drizzle-orm"

import { db } from ".."
import { projects } from "../schema"

type CreateProjectInput = {
  id: string
  userId: string
  prompt: string
  aspectRatio: string
  model: string
  status: string
  originalImageKey: string
  width: number
  height: number
  analysis: { boxes: unknown[]; summary: string }
}

export async function createProject(input: CreateProjectInput) {
  await db.insert(projects).values(input)
}

export async function updateProjectImageByUserId({
  height,
  originalImageKey,
  projectId,
  userId,
  width,
}: {
  height: number
  originalImageKey: string
  projectId: string
  userId: string
  width: number
}) {
  const [project] = await db
    .update(projects)
    .set({
      height,
      originalImageKey,
      width,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning({ id: projects.id })

  return project
}

export async function updateProjectStatusByUserId({
  projectId,
  status,
  userId,
}: {
  projectId: string
  status: string
  userId: string
}) {
  await db
    .update(projects)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
}

export async function updateProjectCleanedImageByUserId({
  cleanedImageKey,
  projectId,
  userId,
}: {
  cleanedImageKey: string
  projectId: string
  userId: string
}) {
  await db
    .update(projects)
    .set({
      cleanedImageKey,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
}

export async function updateProjectAnalysisByUserId({
  boxes,
  projectId,
  userId,
}: {
  boxes: unknown[]
  projectId: string
  userId: string
}) {
  await db
    .update(projects)
    .set({
      analysis: { boxes, summary: "" },
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
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
      analysis: projects.analysis,
      status: projects.status,
      width: projects.width,
      height: projects.height,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  return project
}

export async function findProjectCleanedImageKeyByUserId({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const [project] = await db
    .select({
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
    .where(and(eq(projects.userId, userId), eq(projects.status, "ready")))
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
