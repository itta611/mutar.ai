"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { fontFamilyMap } from "@hengen/svg-renderer"
import {
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type WheelEvent,
} from "react"

import {
  type EditorBox,
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

  return Math.max(
    ...(element.innerText || element.textContent || "")
      .split("\n")
      .map((line) => context.measureText(line).width),
    0
  )
}

function measureTextHeight(element: HTMLElement, lineHeight: number) {
  const range = document.createRange()
  range.selectNodeContents(element)

  const lineCount = new Set(
    Array.from(range.getClientRects()).map((rect) => Math.round(rect.top))
  ).size
  range.detach()

  return (
    Math.max(
      1,
      lineCount,
      (element.innerText || element.textContent || "").split("\n").length
    ) * lineHeight
  )
}

function resizeBboxWidth(box: EditorBox, width: number): EditorBox {
  const xs = box.bbox.map((point) => point.x ?? 0)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const currentWidth = right - left
  const nextWidth = Math.max(1, Math.ceil(width))

  if (Math.ceil(currentWidth) === nextWidth) {
    return box
  }

  const align = box.align ?? "center"
  const nextLeft =
    align === "left"
      ? left
      : align === "right"
        ? right - nextWidth
        : left + currentWidth / 2 - nextWidth / 2

  return {
    ...box,
    bbox: box.bbox.map((point) => ({
      ...point,
      x:
        nextLeft +
        (currentWidth > 0
          ? (((point.x ?? left) - left) / currentWidth) * nextWidth
          : 0),
    })),
  }
}

function resizeBboxHeight(box: EditorBox, height: number): EditorBox {
  const ys = box.bbox.map((point) => point.y ?? 0)
  const top = Math.min(...ys)
  const bottom = Math.max(...ys)
  const currentHeight = bottom - top
  const nextHeight = Math.max(1, Math.ceil(height))

  if (Math.ceil(currentHeight) === nextHeight) {
    return box
  }

  return {
    ...box,
    bbox: box.bbox.map((point) => ({
      ...point,
      y:
        top +
        (currentHeight > 0
          ? (((point.y ?? top) - top) / currentHeight) * nextHeight
          : 0),
    })),
  }
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
  const [containerSize, setContainerSize] = useState<Size>({
    height: 0,
    width: 0,
  })
  const textRefs = useRef<(HTMLDivElement | null)[]>([])
  const [textWidths, setTextWidths] = useState<Array<number | undefined>>([])
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

  useLayoutEffect(() => {
    if (status !== "ready") {
      return
    }

    const nextTextWidths = boxes.map((box, index) => {
      if (box.wrapText) {
        return undefined
      }

      const element = textRefs.current[index]

      return element
        ? Math.max(1, Math.ceil(measureTextWidth(element)))
        : undefined
    })

    setTextWidths((current) =>
      current.length === nextTextWidths.length &&
      current.every((width, index) => width === nextTextWidths[index])
        ? current
        : nextTextWidths
    )

    const nextBoxes = boxes.map((box, index) => {
      const element = textRefs.current[index]

      return element
        ? resizeBboxHeight(box, measureTextHeight(element, box.fontSize * 1.4))
        : box
    })

    if (nextBoxes.some((box, index) => box !== boxes[index])) {
      setBoxes(nextBoxes)
    }
  }, [boxes, setBoxes, status])

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
        <ShimmerText variant="zinc">{loadingText}</ShimmerText>
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

  function updateBboxWidth(index: number, width: number) {
    setBoxes((current) =>
      current.map((box, boxIndex) =>
        boxIndex === index ? resizeBboxWidth(box, width) : box
      )
    )
  }

  function updateBboxHeight(index: number, height: number) {
    setBoxes((current) =>
      current.map((box, boxIndex) =>
        boxIndex === index ? resizeBboxHeight(box, height) : box
      )
    )
  }

  return (
    <div ref={containerRef} className="min-h-full">
      {/** biome-ignore lint/a11y/noSvgWithoutTitle: ツールチップが邪魔だから */}
      <svg
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
          const align = box.align ?? "center"
          const fontFamily = fontFamilyMap[box.fontFamily ?? "gothic"]
          const fontWeight = box.bold ? 700 : 400
          const centerX = left + boxWidth / 2
          const right = left + boxWidth
          const wrapText = box.wrapText ?? false
          const lineHeight = box.fontSize * 1.4
          const editableHeight = boxHeight
          const editableWidth = wrapText
            ? boxWidth
            : (textWidths[index] ?? boxWidth)
          const editableX =
            align === "left"
              ? left
              : align === "right"
                ? right - editableWidth
                : centerX - editableWidth / 2
          const editableY = top + boxHeight / 2 - editableHeight / 2

          return (
            <g className="group" key={`${box.label}-${index}`}>
              <rect
                className="pointer-events-none stroke-transparent group-hover:stroke-indigo-500 group-focus-within:stroke-indigo-500"
                fill="none"
                height={editableHeight + 2}
                strokeWidth={2}
                width={editableWidth + 2}
                x={editableX - 1}
                y={editableY - 1}
              />
              <foreignObject
                x={editableX}
                y={editableY}
                width={editableWidth}
                height={editableHeight}
              >
                {/* biome-ignore lint/a11y/useSemanticElements: contentEditable is required here. */}
                <div
                  aria-label="Edit text"
                  contentEditable
                  ref={(element) => {
                    textRefs.current[index] = element
                  }}
                  role="textbox"
                  suppressContentEditableWarning
                  tabIndex={0}
                  onInput={(event) => {
                    const width = measureTextWidth(event.currentTarget)
                    const height = measureTextHeight(
                      event.currentTarget,
                      lineHeight
                    )

                    updateTextWidth(index, width)
                    updateBboxHeight(index, height)

                    if (!wrapText) {
                      updateBboxWidth(index, width)
                    }
                  }}
                  onBlur={(event) => {
                    const label = event.currentTarget.innerText

                    setBoxes((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label } : item
                      )
                    )
                  }}
                  style={{
                    color: box.color ?? "rgba(0,0,0,1)",
                    boxSizing: "border-box",
                    fontFamily,
                    fontSize: box.fontSize,
                    fontWeight,
                    height: "100%",
                    lineHeight: `${lineHeight}px`,
                    outline: "none",
                    overflowWrap: wrapText ? "anywhere" : "normal",
                    textAlign: align,
                    whiteSpace: wrapText ? "pre-wrap" : "pre",
                    width: "100%",
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
