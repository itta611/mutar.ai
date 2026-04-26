import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/db"
import { projects, textBoxes, users } from "@/db/schema"
import { ensureDatabaseSetup } from "@/db/setup"
import { auth } from "@/lib/auth"
import { runGenerationPipeline } from "@/lib/generation"
import { uploadImageToR2 } from "@/lib/r2"

export const runtime = "nodejs"
export const maxDuration = 120

const requestSchema = z.object({
  prompt: z.string().trim().min(12).max(1200),
})

export async function POST(request: Request) {
  await ensureDatabaseSetup()

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
  }

  const parsedBody = requestSchema.safeParse(body)

  if (!parsedBody.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 })
  }

  const { prompt } = parsedBody.data

  const projectId = nanoid(12)

  await db
    .insert(users)
    .values({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      image: session.user.image,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: session.user.image,
        updatedAt: new Date(),
      },
    })

  try {
    const pipeline = await runGenerationPipeline(prompt)

    const [originalImageKey, cleanedImageKey] = await Promise.all([
      uploadImageToR2({
        keyPrefix: `projects/${projectId}/original`,
        bytes: pipeline.originalImage.uint8Array,
        mediaType: pipeline.originalImage.mediaType,
      }),
      uploadImageToR2({
        keyPrefix: `projects/${projectId}/cleaned`,
        bytes: pipeline.cleanedImage.uint8Array,
        mediaType: pipeline.cleanedImage.mediaType,
      }),
    ])

    await db.insert(projects).values({
      id: projectId,
      userId: session.user.id,
      prompt,
      status: "ready",
      originalImageKey,
      cleanedImageKey,
      width: pipeline.dimensions.width,
      height: pipeline.dimensions.height,
      analysis: pipeline.analysis,
    })

    if (pipeline.analysis.boxes.length > 0) {
      await db.insert(textBoxes).values(
        pipeline.analysis.boxes.map((box) => ({
          id: nanoid(14),
          projectId,
          content: box.text,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          fontFamily: box.fontFamily,
          fontSize: box.fontSize,
          color: "#111111",
        }))
      )
    }

    const [project] = await db
      .select({
        id: projects.id,
      })
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
      )
      .limit(1)

    return NextResponse.json({
      projectId: project?.id ?? projectId,
    })
  } catch (error) {
    console.error("[hengen] failed to generate project", error)
    return NextResponse.json(
      { message: "Failed to generate project" },
      { status: 500 }
    )
  }
}
