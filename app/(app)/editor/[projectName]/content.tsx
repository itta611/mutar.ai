"use client"

import { useAtomValue } from "jotai"
import Image from "next/image"

import { generatingProjectIdsAtom } from "@/components/generated-images/atoms"

export function EditorContent({
  height,
  projectId,
  width,
}: {
  height: number
  projectId: string
  width: number
}) {
  const generatingProjectIds = useAtomValue(generatingProjectIdsAtom)

  if (generatingProjectIds.includes(projectId) || width === 0 || height === 0) {
    return null
  }

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
