"use client"

import { useAtomValue, useSetAtom } from "jotai"
import Image from "next/image"
import { useEffect } from "react"

import {
  editorProjectStatusAtom,
  type ImageSize,
  editorImageSizeAtom,
  editorProjectIdAtom,
} from "@/atom/generate"

export function EditorContent({
  initialImageSize,
  projectId,
}: {
  initialImageSize: ImageSize
  projectId: string
}) {
  const editorProjectStatus = useAtomValue(editorProjectStatusAtom)
  const imageSizes = useAtomValue(editorImageSizeAtom)
  const setEditorProjectStatus = useSetAtom(editorProjectStatusAtom)
  const setImageSize = useSetAtom(editorImageSizeAtom)
  const setProjectId = useSetAtom(editorProjectIdAtom)
  const imageSize = imageSizes[projectId]
  const status = editorProjectStatus[projectId]

  useEffect(() => {
    setProjectId(projectId)
    setImageSize((sizes) => ({
      ...sizes,
      [projectId]: initialImageSize,
    }))
    setEditorProjectStatus((status) => ({
      ...status,
      [projectId]: "ready",
    }))
  }, [
    initialImageSize,
    projectId,
    setEditorProjectStatus,
    setImageSize,
    setProjectId,
  ])

  if (status === "loading" || !imageSize) {
    return null
  }

  const [width, height] = imageSize

  return (
    <Image
      src={`/api/projects/${projectId}/image`}
      alt=""
      width={width}
      height={height}
      unoptimized
      className="max-h-full w-auto max-w-full object-contain"
    />
  )
}
