import { zValidator } from "@hono/zod-validator"
import {
  findProjectDimensionsByUserId,
  updateProjectImageByUserId,
  updateProjectStatusByUserId,
} from "@hengen/db/repo"
import { Hono } from "hono"
import { after } from "next/server"
import { z } from "zod"

import { analyzeGeneratedImage } from "../analyze-generated-image"
import { generateImage } from "../generate-image"
import { uploadImageToR2 } from "../r2"
import { removeTextFromImage } from "../remove-text-from-image"
import { getSession } from "../session"

const generateProjectSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().trim().min(12).max(1200),
  aspectRatio: z.enum(["16:9", "4:3", "3:4", "1:1"]),
  model: z.enum(["google/gemini-2.5-flash-image", "openai/gpt-5.4-image-2"]),
})

async function runGenerateJob({
  aspectRatio,
  model,
  projectId,
  prompt,
  userId,
}: z.infer<typeof generateProjectSchema> & { userId: string }) {
  try {
    const generated = await generateImage(prompt, aspectRatio, model)
    const originalImageKey = await uploadImageToR2({
      keyPrefix: `projects/${projectId}-original`,
      bytes: generated.image.uint8Array,
      mediaType: generated.image.mediaType,
    })

    const project = await updateProjectImageByUserId({
      projectId,
      userId,
      originalImageKey,
      width: generated.dimensions.width,
      height: generated.dimensions.height,
    })

    if (!project) {
      return
    }

    await updateProjectStatusByUserId({
      projectId,
      status: "analyzing",
      userId,
    })

    await Promise.all([
      analyzeGeneratedImage({
        bytes: generated.image.uint8Array,
        projectId,
        userId,
      }),
      removeTextFromImage({
        aspectRatio,
        bytes: generated.image.uint8Array,
        mediaType: generated.image.mediaType,
        projectId,
        userId,
      }),
    ])

    await updateProjectStatusByUserId({
      projectId,
      status: "ready",
      userId,
    })
  } catch (error) {
    await updateProjectStatusByUserId({
      projectId,
      status: "error",
      userId,
    })
    console.error("[hengen] failed to generate project", error)
  }
}

export const generateRoutes = new Hono().post(
  "/",
  zValidator("json", generateProjectSchema),
  async (c) => {
    const session = await getSession(c.req.raw.headers)

    if (!session) {
      return c.json({ message: "Unauthorized" }, 401)
    }

    const { projectId, prompt, aspectRatio, model } = c.req.valid("json")
    const project = await findProjectDimensionsByUserId({
      projectId,
      userId: session.user.id,
    })

    if (!project) {
      return c.json({ message: "Not found" }, 404)
    }

    after(() =>
      runGenerateJob({
        prompt,
        aspectRatio,
        projectId,
        model,
        userId: session.user.id,
      })
    )

    return c.json({ ok: true }, 200)
  }
)
