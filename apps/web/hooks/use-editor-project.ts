"use client"

import { useSetAtom } from "jotai"
import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  type EditorBox,
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
} from "@/atom/generate"
import { apiClient } from "@/lib/api-client"

type EditorProject = {
  analysis: { boxes: EditorBox[]; summary: string }
  height: number
  id: string
  status: "ready"
  width: number
} | {
  id: string
  status: "generating" | "analyzing" | "erasing" | "error"
}

async function getProject(projectId: string) {
  const response = await apiClient.projects[":projectId"].$get({
    param: { projectId },
  })

  if (!response.ok) {
    throw new Error("request_failed")
  }

  return (await response.json()) as EditorProject
}

export function editorProjectQuery(projectId: string) {
  return {
    queryKey: ["editor-project", projectId] as const,
    queryFn: () => getProject(projectId),
    staleTime: 60 * 1000,
  }
}

export function useEditorProject() {
  const queryClient = useQueryClient()
  const setBoxes = useSetAtom(editorBoxesAtom)
  const setImageSize = useSetAtom(editorImageSizeAtom)
  const setProjectId = useSetAtom(editorProjectIdAtom)

  return useCallback(
    async (projectId: string, options?: { force?: boolean }) => {
      setProjectId(projectId)

      try {
        const query = editorProjectQuery(projectId)
        const cached = queryClient.getQueryData<EditorProject>(query.queryKey)
        const project =
          cached?.status === "ready" && !options?.force
            ? cached
            : await queryClient.fetchQuery({ ...query, staleTime: 0 })

        if (project.status !== "ready") {
          setImageSize(null)
          setBoxes([])
          return
        }

        setImageSize([project.width, project.height])
        setBoxes(project.analysis.boxes)
      } catch {
        setImageSize(null)
        setBoxes([])
      }
    },
    [queryClient, setBoxes, setImageSize, setProjectId]
  )
}
