"use client"

import { useAtomValue } from "jotai"
import Image from "next/image"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

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
  const svgRef = useRef<SVGSVGElement>(null)
  const [fontSizes, setFontSizes] = useState<number[]>([])

  useEffect(() => {
    if (currentProjectId !== projectId || status === null) {
      fetchProject(projectId)
    }
  }, [currentProjectId, fetchProject, projectId, status])

  useLayoutEffect(() => {
    const svg = svgRef.current

    if (!svg) {
      return
    }

    const nextFontSizes: number[] = []

    for (const text of Array.from(
      svg.querySelectorAll<SVGTextElement>("text[data-box-width]")
    )) {
      const index = Number(text.dataset.index)
      const boxWidth = Number(text.dataset.boxWidth)
      const fontSize = Number(text.getAttribute("font-size"))
      const textWidth = text.getComputedTextLength()

      nextFontSizes[index] =
        textWidth > 0 ? fontSize * (boxWidth / textWidth) : fontSize
    }

    setFontSizes(nextFontSizes)
  }, [boxes])

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
        ref={svgRef}
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
          const fontSize = boxWidth / Math.max([...box.label].length, 1)

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
                data-box-width={boxWidth}
                data-index={index}
                fill="rgba(0,0,0,0.75)"
                dominantBaseline="middle"
                fontSize={fontSizes[index] ?? fontSize}
                textAnchor="middle"
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
