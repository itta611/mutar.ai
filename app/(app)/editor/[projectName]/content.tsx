"use client"

import { useAtomValue } from "jotai"
import Image from "next/image"
import { useEffect } from "react"

import {
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectStatusAtom,
} from "@/atom/generate"
import { useEditorProject } from "@/hooks/use-editor-project"

export function EditorContent({ projectId }: { projectId: string }) {
  const currentProjectId = useAtomValue(editorProjectIdAtom)
  const status = useAtomValue(editorProjectStatusAtom)
  const imageSize = useAtomValue(editorImageSizeAtom)
  const boxes = useAtomValue(editorBoxesAtom)
  const fetchProject = useEditorProject()

  useEffect(() => {
    if (currentProjectId !== projectId || status === null) {
      fetchProject(projectId)
    }
  }, [currentProjectId, fetchProject, projectId, status])

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
        src={`/api/projects/${projectId}/image`}
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
          if (!box.bbox) {
            return null
          }

          const xs = box.bbox.map((point) => point.x ?? 0)
          const ys = box.bbox.map((point) => point.y ?? 0)
          const left = Math.min(...xs)
          const top = Math.min(...ys)
          const boxWidth = Math.max(...xs) - left
          const boxHeight = Math.max(...ys) - top

          return (
            <g key={`${box.label}-${index}`}>
              <rect
                x={left}
                y={top}
                width={boxWidth}
                height={boxHeight}
                fill="none"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="2"
              />
              <text
                x={left + boxWidth / 2}
                y={top + boxHeight / 2}
                fill="rgba(0,0,0,0.75)"
                dominantBaseline="middle"
                fontSize={boxHeight * 0.8}
                lengthAdjust="spacingAndGlyphs"
                textAnchor="middle"
                textLength={boxWidth}
              >
                {box.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
