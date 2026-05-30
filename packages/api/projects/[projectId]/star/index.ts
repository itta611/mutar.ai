import { zValidator } from "@hono/zod-validator"
import { updateProjectStarredByUserId } from "@hengen/db/repo"
import { Hono } from "hono"
import { z } from "zod"

import { sessionMiddleware, type SessionEnv } from "../../../session"
import { projectParamsSchema } from "../../schema"

const updateProjectStarSchema = z.object({
  isStarred: z.boolean(),
})

export const projectStarRoutes = new Hono<SessionEnv>().put(
  "/",
  sessionMiddleware,
  zValidator("param", projectParamsSchema),
  zValidator("json", updateProjectStarSchema),
  async (c) => {
    const session = c.get("session")

    const { projectId } = c.req.valid("param")
    const { isStarred } = c.req.valid("json")
    const project = await updateProjectStarredByUserId({
      isStarred,
      projectId,
      userId: session.user.id,
    })

    if (!project) {
      return c.json({ message: "Not found" }, 404)
    }

    return c.json({ ok: true }, 200)
  }
)
