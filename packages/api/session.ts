import { auth } from "@mutar/auth"
import { createMiddleware } from "hono/factory"

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export type SessionEnv = {
  Variables: {
    session: Session
  }
}

export const sessionMiddleware = createMiddleware<SessionEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401)
  }

  c.set("session", session)
  await next()
})
