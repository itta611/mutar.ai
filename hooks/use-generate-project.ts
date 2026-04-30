"use client"

import { useSetAtom } from "jotai"

import { generatingProjectIdsAtom } from "@/atom/generate"

type GenerateProjectInput = {
  aspectRatio: string
  model: string
  prompt: string
}

export function useGenerateProject() {
  const setGeneratingProjectIds = useSetAtom(generatingProjectIdsAtom)

  return async function generateProject(input: GenerateProjectInput) {
    const createResponse = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })

    if (!createResponse.ok) {
      throw new Error("create_failed")
    }

    const data = (await createResponse.json()) as { projectId: string }

    setGeneratingProjectIds((ids) => [data.projectId, ...ids])
    void fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: data.projectId,
        ...input,
      }),
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
