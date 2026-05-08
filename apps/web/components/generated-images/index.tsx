"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { EllipsisIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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
  prompt: string
  status: string
  title: string
}

const projectKeys = {
  list: ["projects"] as const,
}

async function listProjects() {
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

export function GeneratedImages({
  initialImages,
}: {
  initialImages: GeneratedImage[]
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
    },
  })

  return (
    <div className="grid grid-cols-2 gap-x-7 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
      {images.map((image) => (
        <div key={image.id} className="active:scale-99 transition duration-75">
          <Link href={`/editor/${image.id}`} className="block">
            {image.status === "ready" ? (
              <Image
                src={`/api/projects/${image.id}/image`}
                alt=""
                width={300}
                height={300}
                unoptimized
                className="aspect-[16/9] w-full object-cover border rounded-t-xl"
              />
            ) : (
              <Skeleton className="aspect-[16/9] w-full rounded-t-xl rounded-b-none border" />
            )}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-b-xl bg-accent">
              <span className="min-w-0 flex-1 truncate text-sm mr-1">
                {image.title}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      type="button"
                      className="text-muted-foreground"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                    >
                      <EllipsisIcon className="size-4.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      navigator.clipboard.writeText(image.prompt)
                    }}
                  >
                    プロンプトをコピー
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      deleteProjectMutation.mutate(image.id)
                    }}
                  >
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
