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
import { getSession } from "../session"

const createProjectSchema = z.object({
  prompt: z.string().trim().min(12).max(1200),
  aspectRatio: z.enum(["auto", "16:9", "4:3", "3:4", "1:1"]),
  model: z.enum(["google/gemini-2.5-flash-image", "openai/gpt-5.4-image-2"]),
})

export const projectsRoutes = new Hono()
  .get("/", async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

    const projects =
      c.req.query("trash") === "true"
        ? await listDeletedImagesByUserId(session.user.id)
        : c.req.query("starred") === "true"
          ? await listStarredImagesByUserId(session.user.id)
          : await listGeneratedImagesByUserId(session.user.id)

    return c.json({ projects }, 200)
  })
  .post("/", zValidator("json", createProjectSchema), async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

    const projectId = randomUUID()
    const { aspectRatio, model, prompt } = c.req.valid("json")

    await createProject({
      id: projectId,
      userId: session.user.id,
      prompt,
      title: prompt,
      aspectRatio,
      model,
      status: "generating",
      width: 0,
      height: 0,
      analysis: { summary: "", boxes: [] },
    })

    try {
      const response = await fetch(
        new URL("/generate", env.HENGEN_WORKER_URL),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.HENGEN_WORKER_SECRET}`,
          },
          body: JSON.stringify({ projectId, prompt, aspectRatio, model }),
        }
      )

      if (!response.ok) {
        return c.json({ message: "Generation failed" }, 502)
      }
    } catch {
      return c.json({ message: "Generation failed" }, 502)
    }

    return c.json({ projectId }, 200)
  })
