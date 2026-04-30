import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"
import { z } from "zod"

import { createProject } from "@/db/repo"
import { auth } from "@/lib/auth"

const requestSchema = z.object({
  prompt: z.string().trim().min(12).max(1200),
})

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const parsedBody = requestSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 })
  }

  const projectId = randomUUID()

  await createProject({
    id: projectId,
    userId: session.user.id,
    prompt: parsedBody.data.prompt,
    status: "generating",
    originalImageKey: "",
    width: 0,
    height: 0,
    analysis: { summary: "", boxes: [] },
  })

  return NextResponse.json({ projectId })
}
