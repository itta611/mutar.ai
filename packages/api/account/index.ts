import { zValidator } from "@hono/zod-validator"
import { db } from "@hengen/db"
import { users } from "@hengen/db/schema"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { sessionMiddleware, type SessionEnv } from "../session"

const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

export const accountRoutes = new Hono<SessionEnv>()
  .use(sessionMiddleware)
  .patch("/", zValidator("json", updateAccountSchema), async (c) => {
    const session = c.get("session")
    const { name } = c.req.valid("json")

    await db.update(users).set({ name }).where(eq(users.id, session.user.id))

    return c.json({ ok: true }, 200)
  })
