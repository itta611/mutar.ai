"use client"

import { useSetAtom } from "jotai"
import { useCallback } from "react"

import {
  type EditorProjectStatus,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectStatusAtom,
} from "@/atom/generate"
import { apiRequest } from "@/lib/api-request"

async function getProject(projectId: string) {
  return apiRequest<{
    height: number
    id: string
    status: EditorProjectStatus
    width: number
  }>(`/api/projects/${projectId}`)
}

export function useEditorProject() {
  const setEditorProjectStatus = useSetAtom(editorProjectStatusAtom)
  const setImageSize = useSetAtom(editorImageSizeAtom)
  const setProjectId = useSetAtom(editorProjectIdAtom)

  return useCallback(
    async (projectId: string) => {
      setProjectId(projectId)
      setEditorProjectStatus("loading")

      try {
        const project = await getProject(projectId)

        setImageSize([project.width, project.height])
        setEditorProjectStatus(project.status)
      } catch {
        setEditorProjectStatus("error")
      }
    },
    [setEditorProjectStatus, setImageSize, setProjectId]
  )
}
