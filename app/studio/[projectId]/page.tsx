import { and, asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { db } from "@/db"
import { projects, textBoxes } from "@/db/schema"
import { ensureDatabaseSetup } from "@/db/setup"
import { requireServerSession } from "@/lib/session"
import { StudioShell } from "@/components/studio-shell"

export default async function StudioPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  await ensureDatabaseSetup()

  const session = await requireServerSession()
  const { projectId } = await params

  const [project] = await db
    .select({
      id: projects.id,
      prompt: projects.prompt,
      width: projects.width,
      height: projects.height,
    })
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
    )
    .limit(1)

  if (!project) {
    notFound()
  }

  const boxes = await db
    .select({
      id: textBoxes.id,
      content: textBoxes.content,
      x: textBoxes.x,
      y: textBoxes.y,
      width: textBoxes.width,
      height: textBoxes.height,
      fontFamily: textBoxes.fontFamily,
      fontSize: textBoxes.fontSize,
      color: textBoxes.color,
    })
    .from(textBoxes)
    .where(eq(textBoxes.projectId, projectId))
    .orderBy(asc(textBoxes.createdAt))

  return <StudioShell project={project} initialBoxes={boxes} />
}
