"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { ProjectDropdownMenuProject } from "@/components/gallary/project-dropdown-menu"
import { apiClient } from "@/lib/api-client"

async function updateProjectStarred({
  project,
  isStarred,
}: {
  project: ProjectDropdownMenuProject
  isStarred: boolean
}) {
  const response = await apiClient.projects[":projectId"].star.$put({
    param: { projectId: project.id },
    json: { isStarred },
  })

  if (!response.ok) {
    throw new Error("update_failed")
  }

  return response.json()
}

export function useUpdateProjectStarred(
  onStarredChange?: (input: { id: string; isStarred: boolean }) => void
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProjectStarred,
    onMutate: (input) => {
      const previousProjects = queryClient.getQueryData<
        ProjectDropdownMenuProject[]
      >(["projects", "starred"])

      onStarredChange?.({
        id: input.project.id,
        isStarred: input.isStarred,
      })
      queryClient.setQueryData<ProjectDropdownMenuProject[]>(
        ["projects", "starred"],
        (projects = []) =>
          input.isStarred
            ? [{ ...input.project, isStarred: true }, ...projects]
            : projects.filter((project) => project.id !== input.project.id)
      )

      return { previousProjects }
    },
    onError: (_error, input, context) => {
      onStarredChange?.({
        id: input.project.id,
        isStarred: !input.isStarred,
      })
      queryClient.setQueryData(
        ["projects", "starred"],
        context?.previousProjects
      )
    },
    onSuccess: (_data, input) => {
      toast.success(
        input.isStarred
          ? "お気に入りに追加しました"
          : "お気に入りから削除しました"
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "starred"] })
    },
  })
}
