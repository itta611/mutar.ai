import { zValidator } from "@hono/zod-validator"
import {
  findProjectByUserId,
  findProjectThumbnailSourceByUserId,
} from "@hengen/db/repo"
import { createProjectSvg, type SvgProject } from "@hengen/svg-renderer"
import { Hono } from "hono"
import sharp from "sharp"

import { projectImageKey, readImageFromR2, uploadImageToR2 } from "../../../r2"
import { getSession } from "../../../session"
import { projectParamsSchema } from "../../schema"

const THUMBNAIL_WIDTH = 640

export async function renderAndSaveProjectThumbnail({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const project = await findProjectThumbnailSourceByUserId({
    projectId,
    userId,
  })

  if (!project) {
    return null
  }

  const image = await readImageFromR2(projectImageKey(projectId, "cleaned"))
  const imageHref = `data:${image.mediaType};base64,${Buffer.from(image.bytes).toString("base64")}`
  const svg = createProjectSvg({
    imageHref,
    project: project as SvgProject,
  })
  const bytes = await sharp(Buffer.from(svg))
    .resize({
      width: THUMBNAIL_WIDTH,
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()
  await uploadImageToR2({
    bytes,
    keyPrefix: `projects/${projectId}/thumbnail`,
    mediaType: "image/png",
  })

  return { ok: true }
}

export const projectThumbnailRoutes = new Hono()
  .get("/", zValidator("param", projectParamsSchema), async (c) => {
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
      return c.json({ message: "Thumbnail not available" }, 404, {
        "Cache-Control": "private, no-store",
      })
    }

    let asset: Awaited<ReturnType<typeof readImageFromR2>>

    try {
      asset = await readImageFromR2(projectImageKey(projectId, "thumbnail"))
    } catch (error) {
      console.error("[hengen] failed to read project thumbnail", error)
      return c.json({ message: "Thumbnail not available" }, 404, {
        "Cache-Control": "private, no-store",
      })
    }

    const body = new ArrayBuffer(asset.bytes.byteLength)
    new Uint8Array(body).set(asset.bytes)

    return new Response(body, {
      headers: {
        "Content-Type": asset.mediaType,
        "Cache-Control": "private, no-store",
      },
    })
  })
  .post("/", zValidator("param", projectParamsSchema), async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

    const { projectId } = c.req.valid("param")

    try {
      const thumbnail = await renderAndSaveProjectThumbnail({
        projectId,
        userId: session.user.id,
      })

      if (!thumbnail) {
        return c.json({ message: "Thumbnail source not available" }, 404)
      }

      return c.json(thumbnail, 200)
    } catch (error) {
      console.error("[hengen] failed to render project thumbnail", error)
      return c.json({ message: "Thumbnail render failed" }, 502)
    }
  })
