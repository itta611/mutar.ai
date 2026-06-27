"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useSetAtom } from "jotai"
import { useEffect } from "react"
import { toast } from "sonner"

import {
  type EditorBox,
  editorBoxesAtom,
  editorSelectedBoxIndexAtom,
  editorSelectedBoxIndexesAtom,
} from "@/atom/generate"
import type { GeneratedImage } from "@/components/gallary"
import { resizeTextBox } from "@/hooks/editor-bbox"
import { apiClient } from "@/lib/api-client"

type ProjectBox = EditorBox & { lineHeight?: number }

type EditorProject =
  | {
      analysis: { boxes: ProjectBox[]; summary: string }
      createdAt: string
      height: number
      id: string
      status: "ready"
      title: string
      width: number
    }
  | {
      createdAt: string
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

export function useEditorProject(projectId: string) {
  const queryClient = useQueryClient()
  const setBoxes = useSetAtom(editorBoxesAtom)
  const setSelectedIndex = useSetAtom(editorSelectedBoxIndexAtom)
  const setSelectedIndexes = useSetAtom(editorSelectedBoxIndexesAtom)
  const query = useQuery({
    ...editorProjectQuery(projectId),
    refetchOnMount: "always",
    refetchInterval: (query) => {
      const status = query.state.data?.status

      return status && status !== "ready" && status !== "error" ? 5000 : false
    },
  })
  const project = query.data

  useEffect(() => {
    if (project?.status !== "error") {
      return
    }

    toast.error("生成に失敗しました。", {
      id: `project-generation-error-${projectId}`,
    })
    queryClient.setQueriesData<GeneratedImage[]>(
      { queryKey: ["projects"] },
      (projects) => projects?.filter((project) => project.id !== projectId)
    )
  }, [project?.status, projectId, queryClient])

  useEffect(() => {
    setSelectedIndex(null)
    setSelectedIndexes([])

    if (!project || query.isError || project.status !== "ready") {
      setBoxes([])
      return
    }

    setBoxes(
      project.analysis.boxes.map(({ lineHeight, ...box }) => {
        const nextBox = {
          ...box,
          lineheight:
            box.label.split("\n").length === 1
              ? 1
              : (box.lineheight ?? lineHeight),
        }

        return resizeTextBox(nextBox, box.label)
      })
    )
  }, [
    project,
    projectId,
    query.isError,
    setBoxes,
    setSelectedIndex,
    setSelectedIndexes,
  ])

  return query
}
