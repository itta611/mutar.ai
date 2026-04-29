import { NextResponse } from "next/server"

import { deleteProjectByUserId } from "@/db/repo"
import { auth } from "@/lib/auth"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await params
  const project = await deleteProjectByUserId({
    projectId,
    userId: session.user.id,
  })

  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
