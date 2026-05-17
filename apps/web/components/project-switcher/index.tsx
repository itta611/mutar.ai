"use client"

import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { listProjects, projectKeys } from "@/components/generated-images"

export function ProjectSwitcher() {
  const { projectName: currentProjectId } = useParams<{
    projectName: string
  }>()
  const router = useRouter()
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

  return (
    <div className="absolute inset-x-0 bottom-2 flex justify-center">
      <div className="scrollbar-none flex max-w-[520px] gap-5 overflow-x-auto px-2 py-1 [mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-40px),transparent)] before:shrink-0 before:basis-[calc(50%-2rem)] after:shrink-0 after:basis-[calc(50%-2rem)]">
        {projects.map((project) => (
          <button
            aria-current={project.id === selectedProjectId ? "page" : undefined}
            className="cursor-pointer aspect-square size-16 shrink-0 overflow-hidden rounded-lg bg-muted border-1 -border-offset-1 border-black/10 aria-[current=page]:ring-2 aria-[current=page]:ring-offset-2 aria-[current=page]:ring-blue-600"
            key={project.id}
            onClick={(event) => {
              setSelectedProjectId(project.id)
              event.currentTarget.scrollIntoView({
                block: "nearest",
                inline: "center",
                behavior: "smooth",
              })
              router.push(`/editor/${project.id}`)
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
