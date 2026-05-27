"use client"

import { useMutation } from "@tanstack/react-query"
import { useSetAtom } from "jotai"

import {
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectTitleAtom,
} from "@/atom/generate"
import { apiClient } from "@/lib/api-client"

export type GenerateProjectInput = NonNullable<Parameters<typeof apiClient.projects.$post>[0]>["json"]

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
  const setImageSize = useSetAtom(editorImageSizeAtom)
  const setProjectId = useSetAtom(editorProjectIdAtom)
  const setProjectTitle = useSetAtom(editorProjectTitleAtom)
  const createProjectMutation = useMutation({ mutationFn: createProject })

  return async function generateProject(input: GenerateProjectInput) {
    const data = await createProjectMutation.mutateAsync(input)

    setProjectId(data.projectId)
    setProjectTitle("新規プロジェクト")
    setImageSize(null)

    return data.projectId
  }
}
