import { randomUUID } from "node:crypto"

import { zValidator } from "@hono/zod-validator"
import {
  createProject,
  deleteProjectByUserId,
  findProjectCleanedImageKeyByUserId,
  findProjectDimensionsByUserId,
  listGeneratedImagesByUserId,
  updateProjectImageByUserId,
  updateProjectStatusByUserId,
} from "@hengen/db/repo"
import { Hono } from "hono"
import { after } from "next/server"
import { z } from "zod"

import { auth } from "./auth"
import { analyzeGeneratedImage } from "./analyze-generated-image"
import { generateImage } from "./generate-image"
import { readImageFromR2, uploadImageToR2 } from "./r2"
import { removeTextFromImage } from "./remove-text-from-image"

const createProjectSchema = z.object({
  prompt: z.string().trim().min(12).max(1200),
})

const generateProjectSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().trim().min(12).max(1200),
  aspectRatio: z.enum(["16:9", "4:3", "3:4", "1:1"]),
  model: z.enum(["google/gemini-2.5-flash-image", "openai/gpt-5.4-image-2"]),
})

const projectParamsSchema = z.object({
  projectId: z.string().min(1),
})

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers })
}

async function runGenerateJob({
  aspectRatio,
  model,
  projectId,
  prompt,
  userId,
}: z.infer<typeof generateProjectSchema> & { userId: string }) {
  try {
    const generated = await generateImage(prompt, aspectRatio, model)
    const originalImageKey = await uploadImageToR2({
      keyPrefix: `projects/${projectId}-original`,
      bytes: generated.image.uint8Array,
      mediaType: generated.image.mediaType,
    })

    const project = await updateProjectImageByUserId({
      projectId,
      userId,
      originalImageKey,
      width: generated.dimensions.width,
      height: generated.dimensions.height,
    })

    if (!project) {
      return
    }

    await updateProjectStatusByUserId({
      projectId,
      status: "analyzing",
      userId,
    })

    await Promise.all([
      analyzeGeneratedImage({
        bytes: generated.image.uint8Array,
        projectId,
        userId,
      }),
      removeTextFromImage({
        aspectRatio,
        bytes: generated.image.uint8Array,
        mediaType: generated.image.mediaType,
        projectId,
        userId,
      }),
    ])

    await updateProjectStatusByUserId({
      projectId,
      status: "ready",
      userId,
    })
  } catch (error) {
    await updateProjectStatusByUserId({
      projectId,
      status: "error",
      userId,
    })
    console.error("[hengen] failed to generate project", error)
  }
}

const routes = new Hono()
  .get("/projects", async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

    const projects = await listGeneratedImagesByUserId(session.user.id)

    return c.json({ projects: projects.map(({ id }) => id) }, 200)
  })
  .post("/projects", zValidator("json", createProjectSchema), async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

    const projectId = randomUUID()
    const { prompt } = c.req.valid("json")

    await createProject({
      id: projectId,
      userId: session.user.id,
      prompt,
      status: "generating",
      originalImageKey: "",
      width: 0,
      height: 0,
      analysis: { summary: "", boxes: [] },
    })

    return c.json({ projectId }, 200)
  })
  .post("/generate", zValidator("json", generateProjectSchema), async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

    const { projectId, prompt, aspectRatio, model } = c.req.valid("json")
    const project = await findProjectDimensionsByUserId({
      projectId,
      userId: session.user.id,
    })

    if (!project) {
      return c.json({ message: "Not found" }, 404)
    }

    after(() =>
      runGenerateJob({
        prompt,
        aspectRatio,
        projectId,
        model,
        userId: session.user.id,
      })
    )

    return c.json({ ok: true }, 200)
  })
  .get(
    "/projects/:projectId",
    zValidator("param", projectParamsSchema),
    async (c) => {
      const session = await getSession(c.req.raw.headers)

      if (!session) {
        return c.json({ message: "Unauthorized" }, 401)
      }

      const { projectId } = c.req.valid("param")
      const project = await findProjectDimensionsByUserId({
        projectId,
        userId: session.user.id,
      })

      if (!project) {
        return c.json({ message: "Not found" }, 404)
      }

      return c.json(project, 200)
    }
  )
  .delete(
    "/projects/:projectId",
    zValidator("param", projectParamsSchema),
    async (c) => {
      const session = await getSession(c.req.raw.headers)

      if (!session) {
        return c.json({ message: "Unauthorized" }, 401)
      }

      const { projectId } = c.req.valid("param")
      const project = await deleteProjectByUserId({
        projectId,
        userId: session.user.id,
      })

      if (!project) {
        return c.json({ message: "Not found" }, 404)
      }

      return c.json({ ok: true }, 200)
    }
  )
  .get(
    "/projects/:projectId/image",
    zValidator("param", projectParamsSchema),
    async (c) => {
      const session = await getSession(c.req.raw.headers)

      if (!session) {
        return c.json({ message: "Unauthorized" }, 401)
      }

      const { projectId } = c.req.valid("param")
      const project = await findProjectCleanedImageKeyByUserId({
        projectId,
        userId: session.user.id,
      })

      if (!project?.cleanedImageKey) {
        return c.json({ message: "Image not available" }, 404, {
          "Cache-Control": "private, no-store",
        })
      }

      let asset: Awaited<ReturnType<typeof readImageFromR2>>

      try {
        asset = await readImageFromR2(project.cleanedImageKey)
      } catch (error) {
        console.error("[hengen] failed to read project image", error)
        return c.json({ message: "Image not available" }, 502)
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
  )

export type AppType = typeof routes

export const app = new Hono().basePath("/api").route("/", routes)
