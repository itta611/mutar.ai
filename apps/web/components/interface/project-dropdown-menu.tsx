"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ClipboardIcon,
  EllipsisIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api-client"

export type ProjectDropdownMenuProject = {
  id: string
  isStarred: boolean
  deletedAt: Date | string | null
  prompt: string
}

async function deleteProject(id: string) {
  const response = await apiClient.projects[":projectId"].$delete({
    param: { projectId: id },
  })

  if (!response.ok) {
    throw new Error("delete_failed")
  }

  return response.json()
}

async function restoreProject(id: string) {
  const response = await apiClient.projects[":projectId"].restore.$post({
    param: { projectId: id },
  })

  if (!response.ok) {
    throw new Error("restore_failed")
  }

  return response.json()
}

async function updateProjectStarred({
  id,
  isStarred,
}: {
  id: string
  isStarred: boolean
}) {
  const response = await apiClient.projects[":projectId"].star.$put({
    param: { projectId: id },
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
    onSuccess: (_data, input) => {
      onStarredChange?.(input)
      queryClient.invalidateQueries({ queryKey: ["projects", "starred"] })
      toast.success(
        input.isStarred
          ? "お気に入りに追加しました"
          : "お気に入りから削除しました"
      )
    },
  })
}

export function ProjectDropdownMenu({
  align = "start",
  onDelete,
  onRestore,
  onStarredChange,
  project,
}: {
  align?: "start" | "center" | "end"
  onDelete?: (id: string) => void
  onRestore?: (id: string) => void
  onStarredChange?: (input: { id: string; isStarred: boolean }) => void
  project: ProjectDropdownMenuProject
}) {
  const queryClient = useQueryClient()
  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (_data, id) => {
      onDelete?.(id)
      queryClient.invalidateQueries({ queryKey: ["projects", "starred"] })
      queryClient.invalidateQueries({ queryKey: ["projects", "trash"] })
      toast.success("プロジェクトを削除しました")
    },
  })
  const restoreProjectMutation = useMutation({
    mutationFn: restoreProject,
    onSuccess: (_data, id) => {
      onRestore?.(id)
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["projects", "starred"] })
      toast.success("プロジェクトを元に戻しました")
    },
  })
  const updateProjectStarredMutation = useUpdateProjectStarred(onStarredChange)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            type="button"
            className="text-muted-foreground"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
          >
            <EllipsisIcon />
          </Button>
        }
      />
      <DropdownMenuContent align={align} className="w-48">
        <DropdownMenuItem
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            navigator.clipboard.writeText(project.prompt)
          }}
        >
          <ClipboardIcon />
          プロンプトをコピー
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            updateProjectStarredMutation.mutate({
              id: project.id,
              isStarred: !project.isStarred,
            })
          }}
        >
          {project.isStarred ? <StarOffIcon /> : <StarIcon />}
          {project.isStarred ? "お気に入りから削除" : "お気に入りに追加"}
        </DropdownMenuItem>
        {project.deletedAt ? (
          <DropdownMenuItem
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              restoreProjectMutation.mutate(project.id)
            }}
          >
            <Undo2Icon />
            元に戻す
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              deleteProjectMutation.mutate(project.id)
            }}
          >
            <Trash2Icon />
            削除
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
