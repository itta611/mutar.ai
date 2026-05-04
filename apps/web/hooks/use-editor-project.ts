"use client"

import { useSetAtom } from "jotai"
import { useCallback } from "react"

import {
  type EditorBox,
  type EditorProjectStatus,
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectStatusAtom,
} from "@/atom/generate"
import { apiClient } from "@/lib/api-client"

async function getProject(projectId: string) {
  const response = await apiClient.projects[":projectId"].$get({
    param: { projectId },
  })

  if (!response.ok) {
    throw new Error("request_failed")
  }

  return (await response.json()) as {
    analysis: { boxes: EditorBox[]; summary: string }
    height: number
    id: string
    status: EditorProjectStatus
    width: number
  }
}

export function useEditorProject() {
  const setEditorProjectStatus = useSetAtom(editorProjectStatusAtom)
  const setBoxes = useSetAtom(editorBoxesAtom)
  const setImageSize = useSetAtom(editorImageSizeAtom)
  const setProjectId = useSetAtom(editorProjectIdAtom)

  return useCallback(
    async (projectId: string) => {
      setProjectId(projectId)

      try {
        const project = await getProject(projectId)

        setImageSize([project.width, project.height])
        setBoxes(project.analysis.boxes)
        setEditorProjectStatus(project.status)
      } catch {
        setEditorProjectStatus("error")
      }
    },
    [setBoxes, setEditorProjectStatus, setImageSize, setProjectId]
  )
}
