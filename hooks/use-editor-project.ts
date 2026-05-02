"use client"

import { useSetAtom } from "jotai"
import { useCallback } from "react"

import {
  type EditorAspectRatio,
  type EditorBox,
  type EditorProjectStatus,
  editorAspectRatioAtom,
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectStatusAtom,
} from "@/atom/generate"
import { apiRequest } from "@/lib/api-request"

async function getProject(projectId: string) {
  return apiRequest<{
    analysis: { boxes: EditorBox[]; summary: string }
    aspectRatio: EditorAspectRatio
    height: number
    id: string
    status: EditorProjectStatus
    width: number
  }>(`/api/projects/${projectId}`)
}

export function useEditorProject() {
  const setEditorProjectStatus = useSetAtom(editorProjectStatusAtom)
  const setAspectRatio = useSetAtom(editorAspectRatioAtom)
  const setBoxes = useSetAtom(editorBoxesAtom)
  const setImageSize = useSetAtom(editorImageSizeAtom)
  const setProjectId = useSetAtom(editorProjectIdAtom)

  return useCallback(
    async (projectId: string) => {
      setProjectId(projectId)
      setEditorProjectStatus("loading")

      try {
        const project = await getProject(projectId)

        setAspectRatio(project.aspectRatio)
        setImageSize([project.width, project.height])
        setBoxes(project.analysis.boxes)
        setEditorProjectStatus(project.status)
      } catch {
        setEditorProjectStatus("error")
      }
    },
    [
      setAspectRatio,
      setBoxes,
      setEditorProjectStatus,
      setImageSize,
      setProjectId,
    ]
  )
}
