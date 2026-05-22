"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useRef } from "react"

import { editorProjectIdAtom } from "@/atom/generate"
import { listProjects } from "@/components/gallary"
import {
  editorProjectQuery,
  useEditorProject,
} from "@/hooks/use-editor-project"
import { Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

function preloadProjectImage(projectId: string) {
  new window.Image().src = `/api/projects/${projectId}/image`
}

function getProjectIdFromPathname() {
  return window.location.pathname.split("/").filter(Boolean).at(-1) ?? null
}

export function ProjectSwitcher() {
  const { projectId: routeProjectId } = useParams<{
    projectId: string
  }>()
  const currentProjectId = useAtomValue(editorProjectIdAtom) ?? routeProjectId
  const fetchProject = useEditorProject()
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

  useEffect(() => {
    const handlePopState = () => {
      const projectId = getProjectIdFromPathname()

      if (!projectId) {
        return
      }

      fetchProject(projectId)
    }

    window.addEventListener("popstate", handlePopState)

    return () => window.removeEventListener("popstate", handlePopState)
  }, [fetchProject])

  return (
    <div className="absolute inset-x-0 bottom-2 flex justify-center">
      <div className="scrollbar-none flex max-w-[520px] gap-5 overflow-x-auto py-1 [mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-40px),transparent)] before:shrink-0 before:basis-[calc(50%-3.25rem)] after:shrink-0 after:basis-[calc(50%-3.25rem)]">
        {projects.map((project) => (
          <button
            aria-current={project.id === currentProjectId ? "page" : undefined}
            className="cursor-pointer aspect-square size-16 shrink-0 overflow-hidden rounded-lg bg-muted aria-[current=page]:outline-2 aria-[current=page]:outline-offset-2 aria-[current=page]:outline-primary"
            key={project.id}
            onClick={() => {
              window.history.pushState(null, "", `/editor/${project.id}`)
              fetchProject(project.id)
            }}
            ref={project.id === currentProjectId ? selectedRef : undefined}
            type="button"
          >
            {project.status === "ready" ? (
              <Image
                alt=""
                className="h-full w-full object-cover"
                height={80}
                src={`/api/projects/${project.id}/thumbnail`}
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
