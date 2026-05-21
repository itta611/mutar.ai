"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ClipboardIcon,
  EllipsisIcon,
  FolderClosedIcon,
  LoaderCircleIcon,
  StarIcon,
  StarOffIcon,
  Trash2Icon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api-client"
import { Button } from "../ui/button"

export type GeneratedImage = {
  id: string
  isStarred: boolean
  prompt: string
  status: string
  title: string
}

export const projectKeys = {
  list: ["projects"] as const,
}

export async function listProjects() {
  const response = await apiClient.projects.$get()

  if (!response.ok) {
    throw new Error("request_failed")
  }

  const data = await response.json()

  return data.projects
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

export function GeneratedImages({
  initialImages,
  starredOnly = false,
}: {
  initialImages: GeneratedImage[]
  starredOnly?: boolean
}) {
  const queryClient = useQueryClient()
  const { data: images = initialImages } = useQuery({
    queryKey: projectKeys.list,
    queryFn: listProjects,
    initialData: initialImages,
  })
  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<GeneratedImage[]>(projectKeys.list, (images) =>
        images?.filter((image) => image.id !== id)
      )
      toast.success("プロジェクトを削除しました")
    },
  })
  const updateProjectStarredMutation = useMutation({
    mutationFn: updateProjectStarred,
    onSuccess: (_data, input) => {
      queryClient.setQueryData<GeneratedImage[]>(projectKeys.list, (images) =>
        images?.map((image) =>
          image.id === input.id
            ? { ...image, isStarred: input.isStarred }
            : image
        )
      )
      toast.success(
        input.isStarred
          ? "お気に入りに追加しました"
          : "お気に入りから削除しました"
      )
    },
  })
  const visibleImages = starredOnly
    ? images.filter((image) => image.isStarred)
    : images

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
      {visibleImages.map((image) => (
        <div
          key={image.id}
          className="transition-transform duration-150 ease-out active:scale-[0.98]"
        >
          <Link href={`/editor/${image.id}`} className="block">
            {image.status === "ready" ? (
              <Image
                src={`/api/projects/${image.id}/thumbnail`}
                alt=""
                width={300}
                height={300}
                unoptimized
                className="aspect-[16/9] w-full rounded-xl object-cover"
              />
            ) : (
              <Skeleton className="aspect-[16/9] w-full rounded-xl" />
            )}
            <div className="flex items-center justify-between px-1 py-2.5 rounded-b-xl bg-background">
              {image.status !== "ready" ? (
                <LoaderCircleIcon className="mr-2 size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
              <span className="min-w-0 flex-1 truncate text-sm mr-1.5">
                {image.title.replace(/\\n|\r?\n/g, " ")}
              </span>
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
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      navigator.clipboard.writeText(image.prompt)
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
                        id: image.id,
                        isStarred: !image.isStarred,
                      })
                    }}
                  >
                    {image.isStarred ? <StarOffIcon /> : <StarIcon />}
                    {image.isStarred
                      ? "お気に入りから削除"
                      : "お気に入りに追加"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      deleteProjectMutation.mutate(image.id)
                    }}
                  >
                    <Trash2Icon />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
