"use client"

import { useMutation } from "@tanstack/react-query"
import { useSetAtom } from "jotai"

import {
  type EditorAspectRatio,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectStatusAtom,
} from "@/atom/generate"
import { apiClient } from "@hengen/api/client"
import { useEditorProject } from "./use-editor-project"

export type GenerateProjectInput = Omit<
  NonNullable<Parameters<typeof apiClient.generate.$post>[0]>["json"],
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

async function generateProjectImage({
  projectId,
  ...input
}: GenerateProjectInput & { projectId: string }) {
  const response = await apiClient.generate.$post({
    json: {
      projectId,
      ...input,
    },
  })

  if (!response.ok) {
    throw new Error("generate_failed")
  }

  return response.json()
}

export function useGenerateProject() {
  const setEditorProjectStatus = useSetAtom(editorProjectStatusAtom)
  const setImageSize = useSetAtom(editorImageSizeAtom)
  const setProjectId = useSetAtom(editorProjectIdAtom)
  const fetchProject = useEditorProject()
  const createProjectMutation = useMutation({ mutationFn: createProject })
  const generateProjectMutation = useMutation({
    mutationFn: generateProjectImage,
  })

  return async function generateProject(input: GenerateProjectInput) {
    const data = await createProjectMutation.mutateAsync(input)

    setProjectId(data.projectId)
    setImageSize(null)
    setEditorProjectStatus("generating")
    void generateProjectMutation
      .mutateAsync({
        projectId: data.projectId,
        ...input,
      })
      .then(async () => {
        await fetchProject(data.projectId)
      })
      .catch(() => {
        setEditorProjectStatus("error")
      })

    return data.projectId
  }
}
