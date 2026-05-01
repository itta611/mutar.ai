"use client"

import { useEffect } from "react"
import { useAtomValue } from "jotai"
import Image from "next/image"

import {
  editorBoxesAtom,
  editorProjectStatusAtom,
  editorImageSizeAtom,
} from "@/atom/generate"
import { useEditorProject } from "@/hooks/use-editor-project"

export function EditorContent({ projectId }: { projectId: string }) {
  const status = useAtomValue(editorProjectStatusAtom)
  const imageSize = useAtomValue(editorImageSizeAtom)
  const boxes = useAtomValue(editorBoxesAtom)
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
    <div
      className="relative max-h-full max-w-full"
      style={{ aspectRatio: `${width} / ${height}`, width }}
    >
      <Image
        src={`/api/projects/${projectId}/image?variant=original`}
        alt=""
        fill
        unoptimized
        className="object-contain"
      />
      <svg
        className="pointer-events-none absolute inset-0 size-full"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title>Editor Overlay</title>
        {boxes.map((box, index) => {
          const xs = box.bbox.map((point) => point.x ?? 0)
          const ys = box.bbox.map((point) => point.y ?? 0)
          const left = Math.min(...xs)
          const top = Math.min(...ys)

          return (
            <rect
              key={`${box.label}-${index}`}
              x={left}
              y={top}
              width={Math.max(...xs) - left}
              height={Math.max(...ys) - top}
              fill="rgba(0,0,0,0.12)"
              stroke="rgba(0,0,0,0.35)"
              strokeWidth="2"
            />
          )
        })}
      </svg>
    </div>
  )
}
