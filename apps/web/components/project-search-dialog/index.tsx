"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SearchIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { listProjects } from "@/components/gallary"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function ProjectSearchDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [query, setQuery] = useState("")
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  })
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return projects
    }

    return projects.filter((project) =>
      `${project.title} ${project.prompt}`
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [projects, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[min(720px,calc(100dvh-4rem))] max-w-200! grid-rows-[auto_1fr] gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">検索</DialogTitle>
        <div className="flex h-16 items-center gap-3 border-b px-5 pr-13">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            className="h-auto border-0 px-0 text-lg focus-visible:ring-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="検索"
            value={query}
          />
        </div>
        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link
                className="block"
                href={`/editor/${project.id}`}
                key={project.id}
                onClick={() => onOpenChange(false)}
              >
                <Image
                  src={`/api/projects/${project.id}/thumbnail`}
                  alt=""
                  width={220}
                  height={124}
                  unoptimized
                  className="aspect-[16/9] w-full rounded-xl object-cover"
                />
                <div className="mt-2 truncate px-1 text-sm">
                  {project.title.replace(/\\n|\r?\n/g, " ")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
