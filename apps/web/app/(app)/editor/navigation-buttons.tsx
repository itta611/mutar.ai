"use client"

import { useQuery } from "@tanstack/react-query"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { listProjects } from "@/components/gallary"
import { Button } from "@/components/ui/button"

export function EditorNavigationButtons() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  })
  const currentIndex = projects.findIndex((project) => project.id === projectId)
  const previousProject = currentIndex > 0 ? projects[currentIndex - 1] : null
  const nextProject =
    currentIndex >= 0 && currentIndex < projects.length - 1
      ? projects[currentIndex + 1]
      : null

  return (
    <>
      <Button
        aria-label="前のプロジェクト"
        className="absolute left-5 top-[calc(50%-48px)] z-10 size-11 -translate-y-1/2 rounded-full text-foreground shadow-xs bg-background!"
        disabled={!previousProject}
        onClick={() =>
          previousProject && router.push(`/editor/${previousProject.id}`)
        }
        size="icon"
        type="button"
        variant="outline"
      >
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        aria-label="次のプロジェクト"
        className="absolute right-5 top-[calc(50%-48px)] z-10 size-11 -translate-y-1/2 rounded-full text-foreground shadow-xs bg-background!"
        disabled={!nextProject}
        onClick={() => nextProject && router.push(`/editor/${nextProject.id}`)}
        size="icon"
        type="button"
        variant="outline"
      >
        <ChevronRightIcon className="size-5" />
      </Button>
    </>
  )
}
