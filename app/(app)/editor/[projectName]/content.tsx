"use client"

import { useAtomValue, useSetAtom } from "jotai"
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
  const setBoxes = useSetAtom(editorBoxesAtom)
  const fetchProject = useEditorProject()
  const svgRef = useRef<SVGSVGElement>(null)
  const [fontSizes, setFontSizes] = useState<number[]>([])

  useEffect(() => {
    if (currentProjectId !== projectId || status === null) {
      fetchProject(projectId)
    }
  }, [currentProjectId, fetchProject, projectId, status])

  useEffect(() => {
    if (status !== "loading") {
      return
    }

    const id = window.setInterval(() => {
      fetchProject(projectId)
    }, 5000)

    return () => window.clearInterval(id)
  }, [fetchProject, projectId, status])

  useLayoutEffect(() => {
    if (!projectId || status !== "ready" || !imageSize || boxes.length === 0) {
      return
    }

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
  }, [boxes.length, imageSize, projectId, status])

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
        className="absolute inset-0 size-full"
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
          const displayFontSize = fontSizes[index] ?? fontSize
          const editableHeight = displayFontSize * 1.4

          return (
            <g key={`${box.label}-${index}`}>
              <text
                x={left + boxWidth / 2}
                y={top + boxHeight / 2}
                data-box-width={boxWidth}
                data-index={index}
                fill={box.color ?? "rgba(0,0,0,0.75)"}
                dominantBaseline="middle"
                fontSize={fontSize}
                opacity="0"
                pointerEvents="none"
                textAnchor="middle"
              >
                {box.label}
              </text>
              <foreignObject
                x={left}
                y={top + boxHeight / 2 - editableHeight / 2}
                width={boxWidth}
                height={editableHeight}
              >
                {/* biome-ignore lint/a11y/useSemanticElements: contentEditable is required here. */}
                <div
                  aria-label="Edit text"
                  contentEditable
                  role="textbox"
                  suppressContentEditableWarning
                  tabIndex={0}
                  onBlur={(event) => {
                    const label = event.currentTarget.textContent ?? ""

                    setBoxes((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label } : item
                      )
                    )
                  }}
                  style={{
                    color: box.color ?? "rgba(0,0,0,0.75)",
                    fontSize: displayFontSize,
                    lineHeight: `${editableHeight}px`,
                    outline: "none",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {box.label}
                </div>
              </foreignObject>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
