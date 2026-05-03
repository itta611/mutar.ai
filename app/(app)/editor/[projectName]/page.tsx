"use client"

import { useAtomValue, useSetAtom } from "jotai"
import {
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type WheelEvent,
} from "react"

import {
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorProjectStatusAtom,
} from "@/atom/generate"
import LogoIcon from "@/components/logo-icon"
import ShimmerText from "@/components/ui/shimmer-text"
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

let measureCanvas: HTMLCanvasElement | null = null

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function measureTextWidth(element: HTMLElement) {
  measureCanvas ??= document.createElement("canvas")

  const context = measureCanvas.getContext("2d")

  if (!context) {
    return element.scrollWidth
  }

  const style = window.getComputedStyle(element)
  context.font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`

  return context.measureText(element.textContent ?? "").width
}

export default function Page({
  params,
}: {
  params: Promise<{ projectName: string }>
}) {
  const { projectName: projectId } = use(params)
  const currentProjectId = useAtomValue(editorProjectIdAtom)
  const status = useAtomValue(editorProjectStatusAtom)
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
  const [textWidths, setTextWidths] = useState<number[]>([])
  const [viewBox, setViewBox] = useState<ViewBox | null>(null)

  useEffect(() => {
    if (currentProjectId !== projectId || status === null) {
      fetchProject(projectId)
    }
  }, [currentProjectId, fetchProject, projectId, status])

  useEffect(() => {
    if (status === "ready" || status === "error") {
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
  }, [])

  if (status !== "ready" || !imageSize) {
    const loadingText = {
      generating: "画像を生成中... (1/3)",
      analyzing: "画像を分析中... (2/3)",
      erasing: "画像を仕上げ中... (2/3)",
      none: "読み込み中...",
      ready: "読み込んでいます...",
      error: "問題が発生しました。",
    }[status]

    return (
      <div
        className="min-h-full flex flex-col items-center justify-center"
        ref={containerRef}
      >
        <LogoIcon className="mb-4 h-12 w-12 animate-[spin_2.5s_linear_infinite] fill-primary dark:fill-zinc-100" />
        <ShimmerText>{loadingText}</ShimmerText>
      </div>
    )
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

  function updateTextWidth(index: number, width: number) {
    const nextWidth = Math.max(1, Math.ceil(width))

    setTextWidths((current) => {
      if (current[index] === nextWidth) {
        return current
      }

      const next = [...current]
      next[index] = nextWidth

      return next
    })
  }

  return (
    <div ref={containerRef} className="min-h-full">
      {/** biome-ignore lint/a11y/noSvgWithoutTitle: ツールチップが邪魔だから */}
      <svg
        ref={svgRef}
        className="size-full overflow-hidden"
        onWheel={handleWheel}
        preserveAspectRatio="xMidYMid meet"
        viewBox={`${activeViewBox.x} ${activeViewBox.y} ${activeViewBox.width} ${activeViewBox.height}`}
        style={{ height: containerSize.height, width: containerSize.width }}
      >
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
          const centerX = left + boxWidth / 2
          const fontSize = boxWidth / Math.max([...box.label].length, 1)
          const displayFontSize = fontSizes[index] ?? fontSize
          const editableHeight = displayFontSize * 1.4
          const editableWidth = textWidths[index] ?? boxWidth

          return (
            <g key={`${box.label}-${index}`}>
              <text
                x={centerX}
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
                x={centerX - editableWidth / 2}
                y={top + boxHeight / 2 - editableHeight / 2}
                width={editableWidth}
                height={editableHeight}
              >
                {/* biome-ignore lint/a11y/useSemanticElements: contentEditable is required here. */}
                <div
                  aria-label="Edit text"
                  contentEditable
                  role="textbox"
                  suppressContentEditableWarning
                  tabIndex={0}
                  onInput={(event) => {
                    updateTextWidth(
                      index,
                      measureTextWidth(event.currentTarget)
                    )
                  }}
                  onBlur={(event) => {
                    const label = event.currentTarget.textContent ?? ""

                    setBoxes((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label } : item
                      )
                    )
                  }}
                  style={{
                    color: box.color ?? "rgba(0,0,0,1)",
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
