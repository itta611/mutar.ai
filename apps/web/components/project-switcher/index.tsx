"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { editorProjectIdAtom } from "@/atom/generate"
import { listProjects, projectKeys } from "@/components/generated-images"
import {
  editorProjectQuery,
  useEditorProject,
} from "@/hooks/use-editor-project"

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
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const { data: projects = [] } = useQuery({
    queryKey: projectKeys.list,
    queryFn: listProjects,
  })

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    })
  }, [selectedProjectId, projects])

  useEffect(() => {
    const currentIndex = projects.findIndex(
      (project) => project.id === selectedProjectId
    )

    if (currentIndex === -1) {
      return
    }

    projects
      .slice(Math.max(0, currentIndex - 3), currentIndex + 4)
      .filter((project) => project.id !== selectedProjectId)
      .forEach((project) => {
        queryClient.prefetchQuery(editorProjectQuery(project.id))
        preloadProjectImage(project.id)
      })
  }, [projects, queryClient, selectedProjectId])

  useEffect(() => {
    const handlePopState = () => {
      const projectId = getProjectIdFromPathname()

      if (!projectId) {
        return
      }

      setSelectedProjectId(projectId)
      fetchProject(projectId)
    }

    window.addEventListener("popstate", handlePopState)

    return () => window.removeEventListener("popstate", handlePopState)
  }, [fetchProject])

  return (
    <div className="absolute inset-x-0 bottom-2 flex justify-center">
      <div className="scrollbar-none flex max-w-[520px] gap-5 overflow-x-auto px-2 py-1 [mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-40px),transparent)] before:shrink-0 before:basis-[calc(50%-2rem)] after:shrink-0 after:basis-[calc(50%-2rem)]">
        {projects.map((project) => (
          <button
            aria-current={project.id === selectedProjectId ? "page" : undefined}
            className="cursor-pointer aspect-square size-16 shrink-0 overflow-hidden rounded-lg bg-muted border-1 -border-offset-1 border-black/10 aria-[current=page]:ring-2 aria-[current=page]:ring-offset-2 aria-[current=page]:ring-indigo-600"
            key={project.id}
            onClick={(event) => {
              setSelectedProjectId(project.id)
              queryClient.prefetchQuery(editorProjectQuery(project.id))
              preloadProjectImage(project.id)
              event.currentTarget.scrollIntoView({
                block: "nearest",
                inline: "center",
                behavior: "smooth",
              })
              window.history.pushState(null, "", `/editor/${project.id}`)
              fetchProject(project.id)
            }}
            ref={project.id === selectedProjectId ? selectedRef : undefined}
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
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}
