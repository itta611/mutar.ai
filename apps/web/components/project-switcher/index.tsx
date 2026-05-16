"use client"

import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import Link from "next/link"

import { listProjects, projectKeys } from "@/components/generated-images"

export function ProjectSwitcher({
  currentProjectId,
}: {
  currentProjectId: string
}) {
  const { data: projects = [] } = useQuery({
    queryKey: projectKeys.list,
    queryFn: listProjects,
  })

  return (
    <div className="absolute inset-x-0 bottom-2 flex justify-center">
      <div className="flex max-w-[520px] gap-5 overflow-x-auto px-2 py-1">
        {projects.map((project) => (
          <Link
            aria-current={project.id === currentProjectId ? "page" : undefined}
            className="aspect-square size-16 shrink-0 overflow-hidden rounded-xl bg-muted border-1 -border-offset-1 border-black/10 aria-[current=page]:ring-2 aria-[current=page]:ring-offset-2 aria-[current=page]:ring-blue-600"
            href={`/editor/${project.id}`}
            key={project.id}
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
          </Link>
        ))}
      </div>
    </div>
  )
}
