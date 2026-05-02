"use client"

import { useAtomValue, useSetAtom } from "jotai"
import {
  type WheelEvent,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import {
  editorAspectRatioAtom,
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectStatusAtom,
} from "@/atom/generate"
import { useEditorProject } from "@/hooks/use-editor-project"

type ViewBox = {
  height: number
  key: string
  width: number
  x: number
  y: number
}

type Size = {
  height: number
  width: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function Page({
  params,
}: {
  params: Promise<{ projectName: string }>
}) {
  const { projectName: projectId } = use(params)
  const currentProjectId = useAtomValue(editorProjectIdAtom)
  const status = useAtomValue(editorProjectStatusAtom)
  const aspectRatio = useAtomValue(editorAspectRatioAtom)
  const imageSize = useAtomValue(editorImageSizeAtom)
  const boxes = useAtomValue(editorBoxesAtom)
  const setBoxes = useSetAtom(editorBoxesAtom)
  const fetchProject = useEditorProject()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [containerSize, setContainerSize] = useState<Size>({
    height: 0,
    width: 0,
  })
  const [fontSizes, setFontSizes] = useState<number[]>([])
  const [viewBox, setViewBox] = useState<ViewBox | null>(null)

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

  useLayoutEffect(() => {
    if (status !== "ready" || !imageSize) {
      return
    }

    const container = containerRef.current

    if (!container) {
      return
    }

    const updateSize = () => {
      const rect = container.getBoundingClientRect()

      setContainerSize({ height: rect.height, width: rect.width })
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [imageSize, status])

  if (status === "loading" && aspectRatio) {
    return (
      <div className="min-h-full">
        <div
          className="max-h-full max-w-full animate-pulse bg-muted"
          style={{
            aspectRatio: aspectRatio.replace(":", " / "),
            width: aspectRatio === "3:4" ? 864 : 1152,
          }}
        />
      </div>
    )
  }

  if (status !== "ready" || !imageSize) {
    return <div className="min-h-full" />
  }

  const [width, height] = imageSize
  const currentViewBoxKey = `${projectId}:${width}:${height}`
  const activeViewBox =
    viewBox?.key === currentViewBoxKey
      ? viewBox
      : { height, key: currentViewBoxKey, width, x: 0, y: 0 }

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault()

    const matrix = event.currentTarget.getScreenCTM()

    if (!matrix) {
      return
    }

    const svgPoint = event.currentTarget.createSVGPoint()
    svgPoint.x = event.clientX
    svgPoint.y = event.clientY
    const pointer = svgPoint.matrixTransform(matrix.inverse())
    const nextScale = event.deltaY < 0 ? 0.9 : 1.1
    const nextWidth = Math.min(
      width,
      Math.max(width / 8, activeViewBox.width * nextScale)
    )
    const nextHeight = Math.min(
      height,
      Math.max(height / 8, activeViewBox.height * nextScale)
    )
    const ratioX = (pointer.x - activeViewBox.x) / activeViewBox.width
    const ratioY = (pointer.y - activeViewBox.y) / activeViewBox.height
    const x = clamp(pointer.x - ratioX * nextWidth, 0, width - nextWidth)
    const y = clamp(pointer.y - ratioY * nextHeight, 0, height - nextHeight)

    setViewBox({
      height: nextHeight,
      key: currentViewBoxKey,
      width: nextWidth,
      x,
      y,
    })
  }

  return (
    <div ref={containerRef} className="min-h-full">
      <svg
        ref={svgRef}
        className="size-full overflow-hidden"
        onWheel={handleWheel}
        preserveAspectRatio="xMidYMid meet"
        viewBox={`${activeViewBox.x} ${activeViewBox.y} ${activeViewBox.width} ${activeViewBox.height}`}
        style={{ height: containerSize.height, width: containerSize.width }}
      >
        <title>Editor Overlay</title>
        <image
          href={`/api/projects/${projectId}/image`}
          height={height}
          preserveAspectRatio="xMidYMid meet"
          width={width}
        />
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
