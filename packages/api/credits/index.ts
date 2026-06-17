import { getCreditUsageByUserId } from "@hengen/db/repo"
import { Hono } from "hono"

import { sessionMiddleware, type SessionEnv } from "../session"

export const creditsRoutes = new Hono<SessionEnv>()
  .use(sessionMiddleware)
  .get("/", async (c) => {
    const session = c.get("session")
    const usage = await getCreditUsageByUserId(session.user.id)

    if (!usage) {
      return c.json({ message: "Not found" }, 404)
    }

    return c.json(usage, 200)
  })
