"use client"

import { useMutation } from "@tanstack/react-query"
import { useSetAtom } from "jotai"

import {
  type EditorAspectRatio,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectStatusAtom,
} from "@/atom/generate"
import { apiClient } from "@/lib/api-client"

export type GenerateProjectInput = Omit<
  NonNullable<Parameters<typeof apiClient.projects.$post>[0]>["json"],
  "projectId"
> & {
  aspectRatio: EditorAspectRatio
}

async function createProject(input: GenerateProjectInput) {
  const response = await apiClient.projects.$post({
    json: input,
  })

  if (!response.ok) {
    throw new Error("create_failed")
  }

  return response.json()
}

export function useGenerateProject() {
  const setEditorProjectStatus = useSetAtom(editorProjectStatusAtom)
  const setImageSize = useSetAtom(editorImageSizeAtom)
  const setProjectId = useSetAtom(editorProjectIdAtom)
  const createProjectMutation = useMutation({ mutationFn: createProject })

  return async function generateProject(input: GenerateProjectInput) {
    const data = await createProjectMutation.mutateAsync(input)

    setProjectId(data.projectId)
    setImageSize(null)
    setEditorProjectStatus("generating")

    return data.projectId
  }
}
