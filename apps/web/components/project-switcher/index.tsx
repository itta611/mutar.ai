"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import { listProjects } from "@/components/gallary"
import { editorProjectQuery } from "@/hooks/use-editor-project"
import { Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

function preloadProjectImage(projectId: string) {
  new window.Image().src = `/api/projects/${projectId}/image?kind=thumbnail`
}

export function ProjectSwitcher() {
  const { projectId: currentProjectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const selectedRef = useRef<HTMLButtonElement>(null)
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  })

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    })
  }, [currentProjectId, projects])

  // プロジェクトの前後３つをprefetchする
  useEffect(() => {
    const currentIndex = projects.findIndex(
      (project) => project.id === currentProjectId
    )

    if (currentIndex === -1) {
      return
    }

    projects
      .slice(Math.max(0, currentIndex - 3), currentIndex + 4)
      .filter((project) => project.id !== currentProjectId)
      .forEach((project) => {
        queryClient.prefetchQuery(editorProjectQuery(project.id))
        preloadProjectImage(project.id)
      })
  }, [currentProjectId, projects, queryClient])

  return (
    <div className="absolute inset-x-0 bottom-2 flex justify-center">
      <div
        className="scrollbar-none flex max-w-[520px] grow gap-5 overflow-x-auto py-1 [mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-40px),transparent)] before:shrink-0 before:basis-[calc(50%-3.25rem)] after:shrink-0 after:basis-[calc(50%-3.25rem)]"
        onWheel={(event) => {
          if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return

          const element = event.currentTarget
          const maxScrollLeft = element.scrollWidth - element.clientWidth

          if (
            (element.scrollLeft <= 0 && event.deltaY < 0) ||
            (element.scrollLeft >= maxScrollLeft && event.deltaY > 0)
          ) {
            return
          }

          event.preventDefault()
          element.scrollLeft += event.deltaY
        }}
      >
        {projects.map((project) => (
          <button
            aria-current={project.id === currentProjectId ? "page" : undefined}
            className="cursor-pointer aspect-square size-16 shrink-0 overflow-hidden rounded-lg bg-muted aria-[current=page]:outline-2 aria-[current=page]:outline-offset-2 aria-[current=page]:outline-primary"
            key={project.id}
            onClick={() => router.push(`/editor/${project.id}`)}
            ref={project.id === currentProjectId ? selectedRef : undefined}
            type="button"
          >
            {project.status === "ready" ? (
              <Image
                alt=""
                className="h-full w-full object-cover"
                height={80}
                src={`/api/projects/${project.id}/image?kind=thumbnail`}
                unoptimized
                width={80}
              />
            ) : (
              <Loader2Icon
                className={cn(
                  "m-auto animate-spin",
                  project.id === currentProjectId
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                size={20}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
