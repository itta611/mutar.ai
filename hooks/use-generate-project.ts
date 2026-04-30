"use client"

import { useMutation } from "@tanstack/react-query"
import { useSetAtom } from "jotai"

import { generatingProjectIdsAtom } from "@/atom/generate"
import { apiRequest } from "@/lib/api-request"

type GenerateProjectInput = {
  aspectRatio: string
  model: string
  prompt: string
}

async function createProject(input: GenerateProjectInput) {
  return apiRequest<{ projectId: string }>("/api/projects", {
    errorMessage: "create_failed",
    method: "POST",
    json: input,
  })
}

async function generateProjectImage({
  projectId,
  ...input
}: GenerateProjectInput & { projectId: string }) {
  return apiRequest("/api/generate", {
    errorMessage: "generate_failed",
    method: "POST",
    json: {
      projectId,
      ...input,
    },
  })
}

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
