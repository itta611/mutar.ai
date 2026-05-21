import { and, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm"

import { db } from ".."
import { projects } from "../schema"

type CreateProjectInput = {
  id: string
  userId: string
  prompt: string
  title: string
  aspectRatio: string
  model: string
  status: string
  width: number
  height: number
  analysis: { boxes: unknown[]; summary: string }
}

export async function createProject(input: CreateProjectInput) {
  await db.insert(projects).values(input)
}

export async function updateProjectImageByUserId({
  height,
  projectId,
  userId,
  width,
}: {
  height: number
  projectId: string
  userId: string
  width: number
}) {
  const [project] = await db
    .update(projects)
    .set({
      height,
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

export async function updateProjectStarredByUserId({
  isStarred,
  projectId,
  userId,
}: {
  isStarred: boolean
  projectId: string
  userId: string
}) {
  const [project] = await db
    .update(projects)
    .set({
      isStarred,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning({ id: projects.id })

  return project
}

export async function updateProjectCleanedImageByUserId({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  await db
    .update(projects)
    .set({
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

export async function findProjectByUserId({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const [project] = await db
    .select({
      id: projects.id,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  return project
}

export async function findProjectThumbnailSource(projectId: string) {
  const [project] = await db
    .select({
      id: projects.id,
      width: projects.width,
      height: projects.height,
      analysis: projects.analysis,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
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
      prompt: projects.prompt,
      isStarred: projects.isStarred,
      status: projects.status,
      title: projects.title,
    })
    .from(projects)
    .where(
      and(
        eq(projects.userId, userId),
        isNull(projects.deletedAt),
        inArray(projects.status, [
          "ready",
          "generating",
          "analyzing",
          "erasing",
        ])
      )
    )
    .orderBy(desc(projects.createdAt))
}

export async function listStarredImagesByUserId(userId: string) {
  return db
    .select({
      id: projects.id,
      prompt: projects.prompt,
      isStarred: projects.isStarred,
      status: projects.status,
      title: projects.title,
    })
    .from(projects)
    .where(
      and(
        eq(projects.userId, userId),
        eq(projects.isStarred, true),
        isNull(projects.deletedAt),
        inArray(projects.status, [
          "ready",
          "generating",
          "analyzing",
          "erasing",
        ])
      )
    )
    .orderBy(desc(projects.createdAt))
}

export async function listDeletedImagesByUserId(userId: string) {
  return db
    .select({
      id: projects.id,
      prompt: projects.prompt,
      isStarred: projects.isStarred,
      status: projects.status,
      title: projects.title,
    })
    .from(projects)
    .where(
      and(
        eq(projects.userId, userId),
        isNotNull(projects.deletedAt),
        inArray(projects.status, [
          "ready",
          "generating",
          "analyzing",
          "erasing",
        ])
      )
    )
    .orderBy(desc(projects.deletedAt))
}

export async function deleteProjectByUserId({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const [project] = await db
    .update(projects)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning({ id: projects.id })

  return project
}

export async function restoreProjectByUserId({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const [project] = await db
    .update(projects)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning({ id: projects.id })

  return project
}
