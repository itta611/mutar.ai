"use client"

import { useMutation } from "@tanstack/react-query"
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
  const createProjectMutation = useMutation({ mutationFn: createProject })

  return async function generateProject(input: GenerateProjectInput) {
    const data = await createProjectMutation.mutateAsync(input)

    return data.projectIds.at(-1)!
  }
}
