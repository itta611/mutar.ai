import { zValidator } from "@hono/zod-validator"
import { updateProjectStarredByUserId } from "@hengen/db/repo"
import { Hono } from "hono"
import { z } from "zod"

import { getSession } from "../../../session"
import { projectParamsSchema } from "../../schema"

const updateProjectStarSchema = z.object({
  isStarred: z.boolean(),
})

export const projectStarRoutes = new Hono().put(
  "/",
  zValidator("param", projectParamsSchema),
  zValidator("json", updateProjectStarSchema),
  async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

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
