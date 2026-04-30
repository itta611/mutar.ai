"use client"

import { useMutation } from "@tanstack/react-query"
import { useSetAtom } from "jotai"

import {
  createProject,
  type GenerateProjectInput,
  generateProjectImage,
} from "@/api/projects"
import { generatingProjectIdsAtom } from "@/atom/generate"

export function useGenerateProject() {
  const setGeneratingProjectIds = useSetAtom(generatingProjectIdsAtom)
  const createProjectMutation = useMutation({ mutationFn: createProject })
  const generateProjectMutation = useMutation({
    mutationFn: generateProjectImage,
  })

  return async function generateProject(input: GenerateProjectInput) {
    const data = await createProjectMutation.mutateAsync(input)

    setGeneratingProjectIds((ids) => [data.projectId, ...ids])
    void generateProjectMutation
      .mutateAsync({
        projectId: data.projectId,
        ...input,
      })
      .catch(() => {})
      .finally(() => {
        setGeneratingProjectIds((ids) =>
          ids.filter((id) => id !== data.projectId)
        )
      })

    return data.projectId
  }
}
