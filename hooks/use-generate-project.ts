"use client"

import { useMutation } from "@tanstack/react-query"
import { useSetAtom } from "jotai"

import {
  generatedProjectImagesAtom,
  projectGenerationStatusAtom,
} from "@/atom/generate"
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
  return apiRequest<{ height: number; projectId: string; width: number }>(
    "/api/generate",
    {
      errorMessage: "generate_failed",
      method: "POST",
      json: {
        projectId,
        ...input,
      },
    }
  )
}

export function useGenerateProject() {
  const setGeneratedProjectImages = useSetAtom(generatedProjectImagesAtom)
  const setProjectGenerationStatus = useSetAtom(projectGenerationStatusAtom)
  const createProjectMutation = useMutation({ mutationFn: createProject })
  const generateProjectMutation = useMutation({
    mutationFn: generateProjectImage,
  })

  return async function generateProject(input: GenerateProjectInput) {
    const data = await createProjectMutation.mutateAsync(input)

    setProjectGenerationStatus((status) => ({
      ...status,
      [data.projectId]: "generating",
    }))
    void generateProjectMutation
      .mutateAsync({
        projectId: data.projectId,
        ...input,
      })
      .then((image) => {
        setGeneratedProjectImages((images) => ({
          ...images,
          [data.projectId]: {
            height: image.height,
            imageData: `/api/projects/${data.projectId}/image`,
            width: image.width,
          },
        }))
        setProjectGenerationStatus((status) => ({
          ...status,
          [data.projectId]: "ready",
        }))
      })
      .catch(() => {
        setProjectGenerationStatus((status) => ({
          ...status,
          [data.projectId]: "error",
        }))
      })

    return data.projectId
  }
}
