import { zValidator } from "@hono/zod-validator"
import {
  deleteProjectByUserId,
  findProjectDimensionsByUserId,
  restoreProjectByUserId,
} from "@hengen/db/repo"
import { Hono } from "hono"

import { getSession } from "../../session"
import { projectParamsSchema } from "../schema"

export const projectRoutes = new Hono()
  .get("/", zValidator("param", projectParamsSchema), async (c) => {
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

    if (project.status !== "ready") {
      return c.json(
        {
          id: project.id,
          title: project.title,
          status: project.status,
        },
        200
      )
    }

    return c.json(project, 200)
  })
  .delete("/", zValidator("param", projectParamsSchema), async (c) => {
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
  })
  .post("/restore", zValidator("param", projectParamsSchema), async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

    const { projectId } = c.req.valid("param")
    const project = await restoreProjectByUserId({
      projectId,
      userId: session.user.id,
    })

    if (!project) {
      return c.json({ message: "Not found" }, 404)
    }

    return c.json({ ok: true }, 200)
  })
