"use client"

import { useAtomValue } from "jotai"
import Image from "next/image"
import { useEffect } from "react"

import { editorProjectStatusAtom, editorImageSizeAtom } from "@/atom/generate"
import { useEditorProject } from "@/hooks/use-editor-project"

export function EditorContent({ projectId }: { projectId: string }) {
  const status = useAtomValue(editorProjectStatusAtom)
  const imageSize = useAtomValue(editorImageSizeAtom)
  const fetchProject = useEditorProject()

  useEffect(() => {
    if (status === null) {
      fetchProject(projectId)
    }
  }, [fetchProject, projectId, status])

  if (status !== "ready" || !imageSize) {
    return null
  }

  const [width, height] = imageSize

  return (
    <Image
      src={`/api/projects/${projectId}/image?variant=original`}
      alt=""
      width={width}
      height={height}
      unoptimized
      className="max-h-full w-auto max-w-full object-contain"
    />
  )
}
