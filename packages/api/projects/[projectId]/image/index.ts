import { zValidator } from "@hono/zod-validator"
import { findProjectByUserId } from "@hengen/db/repo"
import { Hono } from "hono"

import { projectImageKey, readImageFromR2 } from "../../../r2"
import { getSession } from "../../../session"
import { projectParamsSchema } from "../../schema"

export const projectImageRoutes = new Hono().get(
  "/",
  zValidator("param", projectParamsSchema),
  async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

    const { projectId } = c.req.valid("param")
    const project = await findProjectByUserId({
      projectId,
      userId: session.user.id,
    })

    if (!project) {
      return c.json({ message: "Image not available" }, 404, {
        "Cache-Control": "private, no-store",
      })
    }

    let asset: Awaited<ReturnType<typeof readImageFromR2>>

    try {
      asset = await readImageFromR2(projectImageKey(projectId, "cleaned"))
    } catch (error) {
      console.error("[hengen] failed to read project image", error)
      return c.json({ message: "Image not available" }, 404, {
        "Cache-Control": "private, no-store",
      })
    }

    const body = new ArrayBuffer(asset.bytes.byteLength)
    new Uint8Array(body).set(asset.bytes)

    return new Response(body, {
      headers: {
        "Content-Type": asset.mediaType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    })
  }
)
