"use client"

import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { useParams } from "next/navigation"
import { useEffect } from "react"

import { editorImageSizeAtom, editorProjectIdAtom } from "@/atom/generate"
import { listProjects, projectKeys } from "@/components/gallary"
import { useEditorProject } from "@/hooks/use-editor-project"

export function useEditorProjectSync() {
  const { projectId: routeProjectId } = useParams<{
    projectId: string
  }>()
  const currentProjectId = useAtomValue(editorProjectIdAtom) ?? routeProjectId
  const imageSize = useAtomValue(editorImageSizeAtom)
  const fetchProject = useEditorProject()
  const { data: projects = [] } = useQuery({
    queryKey: projectKeys.list,
    queryFn: listProjects,
    refetchInterval: (query) =>
      query.state.data?.some((project) => project.status !== "ready")
        ? 5000
        : false,
  })

  useEffect(() => {
    const currentProject = projects.find(
      (project) => project.id === currentProjectId
    )

    if (!currentProject || currentProject.status !== "ready" || imageSize) {
      return
    }

    fetchProject(currentProject.id, { force: true })
  }, [currentProjectId, fetchProject, imageSize, projects])
}
