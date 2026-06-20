"use client"

import { useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api-client"

const queryKey = ["editor-settings"] as const

async function getEditorSettings() {
  const response = await apiClient.account.settings.$get()

  if (!response.ok) {
    throw new Error("request_failed")
  }

  return response.json()
}

export function useEditorSettings() {
  return useQuery({
    queryKey,
    queryFn: getEditorSettings,
  })
}

export function useUpdateEditorSettings() {
  const queryClient = useQueryClient()
  const version = useRef(0)

  return useMutation({
    scope: { id: "editor-settings" },
    mutationFn: async (editorSettings: { snapToGrid: boolean }) => {
      const response = await apiClient.account.settings.$patch({
        json: editorSettings,
      })

      if (!response.ok) {
        throw new Error("request_failed")
      }

      return response.json()
    },
    onMutate: (editorSettings) => {
      const previousData = queryClient.getQueryData<
        Awaited<ReturnType<typeof getEditorSettings>>
      >(queryKey)
      const mutationVersion = ++version.current

      queryClient.setQueryData(queryKey, {
        ...previousData,
        editorSettings: {
          ...previousData?.editorSettings,
          ...editorSettings,
        },
      })

      return { mutationVersion, previousData }
    },
    onError: (_error, _editorSettings, context) => {
      if (context?.mutationVersion === version.current) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
  })
}
