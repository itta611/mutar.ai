import { zValidator } from "@hono/zod-validator"
import { db } from "@mutar/db"
import { users } from "@mutar/db/schema"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"

import { sessionMiddleware, type SessionEnv } from "../session"

const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(80),
})

const updateEditorSettingsSchema = z.object({
  snapToGrid: z.boolean(),
})

export const accountRoutes = new Hono<SessionEnv>()
  .use(sessionMiddleware)
  .get("/settings", async (c) => {
    const session = c.get("session")
    const [user] = await db
      .select({ editorSettings: users.editorSettings })
      .from(users)
      .where(eq(users.id, session.user.id))

    return c.json(user)
  })
  .patch(
    "/settings",
    zValidator("json", updateEditorSettingsSchema),
    async (c) => {
      const session = c.get("session")
      const editorSettings = c.req.valid("json")

      await db
        .update(users)
        .set({ editorSettings })
        .where(eq(users.id, session.user.id))

      return c.json({ editorSettings })
    }
  )
  .patch("/", zValidator("json", updateAccountSchema), async (c) => {
    const session = c.get("session")
    const { name } = c.req.valid("json")

    await db.update(users).set({ name }).where(eq(users.id, session.user.id))

    return c.json({ ok: true }, 200)
  })
