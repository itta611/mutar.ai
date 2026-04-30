import { notFound } from "next/navigation"

import { findProjectDimensionsByUserId } from "@/db/repo"
import { getServerSession } from "@/lib/session"
import { EditorContent } from "./content"

export default async function Page({
  params,
}: {
  params: Promise<{ projectName: string }>
}) {
  const session = await getServerSession()

  if (!session) {
    notFound()
  }

  const { projectName } = await params
  const project = await findProjectDimensionsByUserId({
    projectId: projectName,
    userId: session.user.id,
  })

  if (!project) {
    notFound()
  }

  return (
    <div className="flex h-full items-center justify-center bg-zinc-50 p-8">
      <EditorContent
        projectId={project.id}
        width={project.width}
        height={project.height}
      />
    </div>
  )
}
