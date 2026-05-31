"use client"

import { useSetAtom } from "jotai"
import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  type EditorBox,
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectTitleAtom,
} from "@/atom/generate"
import { calculateLetterSpacing, resizeTextBox } from "@/hooks/editor-bbox"
import { apiClient } from "@/lib/api-client"

type ProjectBox = EditorBox & { lineHeight?: number }

type EditorProject =
  | {
      analysis: { boxes: ProjectBox[]; summary: string }
      height: number
      id: string
      status: "ready"
      title: string
      width: number
    }
  | {
      id: string
      status: "generating" | "analyzing" | "erasing" | "error"
      title: string
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
  const setProjectTitle = useSetAtom(editorProjectTitleAtom)

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

        setProjectTitle(project.title)

        if (project.status !== "ready") {
          setImageSize(null)
          setBoxes([])
          return
        }

        setImageSize([project.width, project.height])
        setBoxes(
          project.analysis.boxes.map(({ lineHeight, ...box }) => {
            const nextBox = { ...box, lineheight: box.lineheight ?? lineHeight }

            return resizeTextBox(
              { ...nextBox, letterSpacing: calculateLetterSpacing(nextBox) },
              box.label
            )
          })
        )
      } catch {
        setProjectTitle("")
        setImageSize(null)
        setBoxes([])
      }
    },
    [queryClient, setBoxes, setImageSize, setProjectId, setProjectTitle]
  )
}
