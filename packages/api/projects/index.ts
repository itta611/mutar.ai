import { randomUUID } from "node:crypto"

import { zValidator } from "@hono/zod-validator"
import {
  createProject,
  listDeletedImagesByUserId,
  listGeneratedImagesByUserId,
  listStarredImagesByUserId,
} from "@hengen/db/repo"
import { Hono } from "hono"
import { z } from "zod"

import { env } from "@/lib/env"
import { sessionMiddleware, type SessionEnv } from "../session"

const createProjectBaseSchema = z.object({
  prompt: z.string().trim().max(1200),
  aspectRatio: z.enum(["auto", "16:9", "4:3", "3:4", "1:1"]),
  count: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  referenceImages: z.array(z.string().startsWith("data:image/")).optional(),
  style: z
    .object({
      themeColor: z.string(),
      backgroundColor: z.string(),
      transparentBackground: z.boolean(),
    })
    .optional(),
})

const createProjectSchema = z.union([
  createProjectBaseSchema.extend({
    prompt: z.string().trim().min(1).max(1200),
  }),
  createProjectBaseSchema.extend({
    referenceImages: z.array(z.string().startsWith("data:image/")).min(1),
  }),
])

export const projectsRoutes = new Hono<SessionEnv>()
  .use(sessionMiddleware)
  .get("/", async (c) => {
    const session = c.get("session")

    const projects =
      c.req.query("trash") === "true"
        ? await listDeletedImagesByUserId(session.user.id)
        : c.req.query("starred") === "true"
          ? await listStarredImagesByUserId(session.user.id)
          : await listGeneratedImagesByUserId(session.user.id)

    return c.json({ projects }, 200)
  })
  .post("/", zValidator("json", createProjectSchema), async (c) => {
    const session = c.get("session")

    const { aspectRatio, count, prompt, referenceImages, style } =
      c.req.valid("json")
    const projectIds = Array.from({ length: count }, () => randomUUID())

    await Promise.all(
      projectIds.map((projectId) =>
        createProject({
          id: projectId,
          userId: session.user.id,
          prompt,
          title: "新規プロジェクト",
          aspectRatio,
          status: "generating",
          width: 0,
          height: 0,
          analysis: { summary: "", boxes: [] },
        })
      )
    )

    try {
      const responses = await Promise.all(
        projectIds.map((projectId) =>
          fetch(new URL("/generate", env.HENGEN_WORKER_URL), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.HENGEN_WORKER_SECRET}`,
            },
            body: JSON.stringify({
              projectId,
              prompt,
              aspectRatio,
              referenceImages,
              style,
            }),
          })
        )
      )

      if (responses.some((response) => !response.ok)) {
        return c.json({ message: "Generation failed" }, 502)
      }
    } catch {
      return c.json({ message: "Generation failed" }, 502)
    }

    return c.json({ projectIds }, 200)
  })
