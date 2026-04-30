"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { EllipsisIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { deleteProject, listProjects, projectKeys } from "@/api/projects"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button"

export function GeneratedImages({
  initialImages,
}: {
  initialImages: string[]
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
      queryClient.setQueryData<string[]>(projectKeys.list, (images) =>
        images?.filter((image) => image !== id)
      )
    },
  })

  return (
    <div className="grid grid-cols-2 gap-x-7 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
      {images.map((image) => (
        <div key={image} className="active:scale-99 transition duration-75">
          <Link href={`/editor/${image}`} className="block">
            <Image
              src={`/api/projects/${image}/image?variant=original`}
              alt=""
              width={300}
              height={300}
              unoptimized
              className="aspect-[16/9] w-full object-cover border rounded-t-xl"
            />
            <div className="flex items-center justify-between px-4 py-2.5 rounded-b-xl bg-accent">
              <span className="text-sm">タイトル</span>
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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => deleteProjectMutation.mutate(image)}
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
