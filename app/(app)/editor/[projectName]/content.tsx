"use client"

import { useAtomValue } from "jotai"
import Image from "next/image"

import {
  generatedProjectImagesAtom,
  projectGenerationStatusAtom,
} from "@/atom/generate"

export function EditorContent({ projectId }: { projectId: string }) {
  const generatedProjectImages = useAtomValue(generatedProjectImagesAtom)
  const projectGenerationStatus = useAtomValue(projectGenerationStatusAtom)
  const image = generatedProjectImages[projectId]
  const status = projectGenerationStatus[projectId]

  if (status === "generating" || !image) {
    return null
  }

  return (
    <Image
      src={image.imageData}
      alt=""
      width={image.width}
      height={image.height}
      unoptimized
      className="max-h-full w-auto max-w-full object-contain"
    />
  )
}
