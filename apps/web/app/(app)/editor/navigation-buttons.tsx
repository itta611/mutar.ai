"use client"

import { useQuery } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useParams } from "next/navigation"

import { editorProjectIdAtom } from "@/atom/generate"
import { listProjects, projectKeys } from "@/components/generated-images"
import { Button } from "@/components/ui/button"
import { useEditorProject } from "@/hooks/use-editor-project"

export function EditorNavigationButtons() {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>()
  const currentProjectId = useAtomValue(editorProjectIdAtom) ?? routeProjectId
  const fetchProject = useEditorProject()
  const { data: projects = [] } = useQuery({
    queryKey: projectKeys.list,
    queryFn: listProjects,
  })
  const currentIndex = projects.findIndex(
    (project) => project.id === currentProjectId
  )
  const previousProject = currentIndex > 0 ? projects[currentIndex - 1] : null
  const nextProject =
    currentIndex >= 0 && currentIndex < projects.length - 1
      ? projects[currentIndex + 1]
      : null

  function navigate(projectId: string) {
    window.history.pushState(null, "", `/editor/${projectId}`)
    fetchProject(projectId)
  }

  return (
    <>
      <Button
        aria-label="前のプロジェクト"
        className="absolute left-7 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full text-foreground shadow-lg bg-background!"
        disabled={!previousProject}
        onClick={() => previousProject && navigate(previousProject.id)}
        size="icon"
        type="button"
        variant="outline"
      >
        <ChevronLeftIcon className="size-5" />
      </Button>
      <Button
        aria-label="次のプロジェクト"
        className="absolute right-7 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full text-foreground shadow-lg bg-background!"
        disabled={!nextProject}
        onClick={() => nextProject && navigate(nextProject.id)}
        size="icon"
        type="button"
        variant="outline"
      >
        <ChevronRightIcon className="size-5" />
      </Button>
    </>
  )
}
