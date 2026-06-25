"use client"

import { LoaderCircleIcon, StarIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { usePromptForm } from "@/hooks/use-prompt-form"
import { useUpdateProjectStarred } from "@/hooks/use-update-project-starred"
import { apiClient } from "@/lib/api-client"
import { ProjectDropdownMenu } from "./project-dropdown-menu"

export type GeneratedImage = {
  id: string
  isStarred: boolean
  deletedAt: Date | string | null
  prompt: string
  status: string
  title: string
}

export async function listProjects() {
  const response = await apiClient.projects.$get()

  if (!response.ok) {
    throw new Error("request_failed")
  }

  const data = await response.json()

  return data.projects
}

type GeneratedImagesViewProps = {
  initialImages: GeneratedImage[]
  queryKey: readonly string[]
}

export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index}>
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          <Skeleton className="mx-1 my-4 h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function Gallery({ initialImages, queryKey }: GeneratedImagesViewProps) {
  const { attachProjectImage } = usePromptForm()
  const [images, setImages] = useState(initialImages)
  const handleStarredChange = (input: { id: string; isStarred: boolean }) =>
    setImages((images) =>
      queryKey[1] === "starred" && !input.isStarred
        ? images.filter((image) => image.id !== input.id)
        : images.map((image) =>
            image.id === input.id
              ? { ...image, isStarred: input.isStarred }
              : image
          )
    )
  const updateProjectStarredMutation =
    useUpdateProjectStarred(handleStarredChange)

  if (images.length === 0) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 text-muted-foreground">
        <Image src="/empty-state.png" alt="" width={160} height={187} />
        <p className="text-sm">プロジェクトがありません</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="transition-transform duration-150 ease-out"
        >
          <div className="relative">
            <Link href={`/editor/${image.id}`} className="block">
              {image.status === "ready" ? (
                <Image
                  src={`/api/projects/${image.id}/image?kind=thumbnail`}
                  alt=""
                  width={300}
                  height={300}
                  unoptimized
                  className="aspect-[16/9] w-full rounded-xl object-cover"
                />
              ) : (
                <Skeleton className="aspect-[16/9] w-full rounded-xl" />
              )}
            </Link>
            {image.isStarred ? (
              <button
                type="button"
                aria-label="お気に入りから削除"
                className="cursor-pointer absolute top-2 right-2 rounded-full p-1.5 text-amber-400"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  updateProjectStarredMutation.mutate({
                    project: image,
                    isStarred: false,
                  })
                }}
              >
                <StarIcon className="size-5 fill-current" />
              </button>
            ) : null}
          </div>
          <div className="flex items-center justify-between px-1 py-2.5 rounded-b-xl bg-background">
            {image.status !== "ready" ? (
              <LoaderCircleIcon className="mr-2 size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : null}
            <Link
              href={`/editor/${image.id}`}
              className="min-w-0 flex-1 truncate text-sm mr-1.5"
            >
              {image.title.replace(/\\n|\r?\n/g, " ")}
            </Link>
            <ProjectDropdownMenu
              project={image}
              onPromptAttach={(project) => void attachProjectImage(project)}
              onDelete={(id) =>
                setImages((images) => images.filter((image) => image.id !== id))
              }
              onRestore={(id) =>
                setImages((images) => images.filter((image) => image.id !== id))
              }
              onStarredChange={(project, isStarred) =>
                updateProjectStarredMutation.mutate({ project, isStarred })
              }
            />
          </div>
        </div>
      ))}
    </div>
  )
}
