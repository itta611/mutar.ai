"use client"

import { useMutation } from "@tanstack/react-query"
import { useSetAtom } from "jotai"

import {
  editorProjectStatusAtom,
  editorPmageSizeAtom,
  editorProjectIdAtom,
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
  const setEditorProjectStatus = useSetAtom(editorProjectStatusAtom)
  const setImageSize = useSetAtom(editorPmageSizeAtom)
  const setProjectId = useSetAtom(editorProjectIdAtom)
  const createProjectMutation = useMutation({ mutationFn: createProject })
  const generateProjectMutation = useMutation({
    mutationFn: generateProjectImage,
  })

  return async function generateProject(input: GenerateProjectInput) {
    const data = await createProjectMutation.mutateAsync(input)

    setProjectId(data.projectId)
    setEditorProjectStatus((status) => ({
      ...status,
      [data.projectId]: "generating",
    }))
    void generateProjectMutation
      .mutateAsync({
        projectId: data.projectId,
        ...input,
      })
      .then((image) => {
        setImageSize((sizes) => ({
          ...sizes,
          [data.projectId]: [image.width, image.height],
        }))
        setEditorProjectStatus((status) => ({
          ...status,
          [data.projectId]: "ready",
        }))
      })
      .catch(() => {
        setEditorProjectStatus((status) => ({
          ...status,
          [data.projectId]: "error",
        }))
      })

    return data.projectId
  }
}
