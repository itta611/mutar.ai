"use client"

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

  return useMutation({
    mutationFn: async (editorSettings: { snapToGrid: boolean }) => {
      const response = await apiClient.account.settings.$patch({
        json: editorSettings,
      })

      if (!response.ok) {
        throw new Error("request_failed")
      }

      return response.json()
    },
    onSuccess: (data) => queryClient.setQueryData(queryKey, data),
  })
}
