"use client"

import { useAtomValue, useSetAtom } from "jotai"
import Konva from "konva"
import { use, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Html } from "react-konva-utils"
import {
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
} from "react-konva"
import { fontFamilyMap } from "@hengen/svg-renderer"

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

type TextStyle = {
  bold: boolean
  fontFamily: string
  fontSize: number
}

type EditingText = {
  index: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getBoxRect(box: EditorBox) {
  const xs = box.bbox.map((point) => point.x ?? 0)
  const ys = box.bbox.map((point) => point.y ?? 0)
  const left = Math.min(...xs)
  const top = Math.min(...ys)

  return {
    height: Math.max(...ys) - top,
    left,
    top,
    width: Math.max(...xs) - left,
  }
}

function resizeBboxWidth(box: EditorBox, width: number): EditorBox {
  const rect = getBoxRect(box)
  const nextWidth = Math.max(1, Math.ceil(width))

  if (Math.ceil(rect.width) === nextWidth) {
    return box
  }

  const align = box.align ?? "center"
  const nextLeft =
    align === "left"
      ? rect.left
      : align === "right"
        ? rect.left + rect.width - nextWidth
        : rect.left + rect.width / 2 - nextWidth / 2

  return {
    ...box,
    bbox: box.bbox.map((point) => ({
      ...point,
      x:
        nextLeft +
        (rect.width > 0
          ? (((point.x ?? rect.left) - rect.left) / rect.width) * nextWidth
          : 0),
    })),
  }
}

function resizeBboxHeight(box: EditorBox, height: number): EditorBox {
  const rect = getBoxRect(box)
  const nextHeight = Math.max(1, Math.ceil(height))

  if (Math.ceil(rect.height) === nextHeight) {
    return box
  }

  return {
    ...box,
    bbox: box.bbox.map((point) => ({
      ...point,
      y:
        rect.top +
        (rect.height > 0
          ? (((point.y ?? rect.top) - rect.top) / rect.height) * nextHeight
          : 0),
    })),
  }
}

function createTextMeasurer(style: TextStyle) {
  return new Konva.Text({
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontStyle: style.bold ? "bold" : "normal",
    lineHeight: 1.4,
    text: "Hg",
  })
}

function getTextNodeTopInset(
  textNode: Pick<Konva.Text, "fontSize" | "lineHeight">,
  measurer: Pick<Konva.Text, "measureSize">
) {
  const metrics = measurer.measureSize("Hg")
  const lineHeight = textNode.fontSize() * textNode.lineHeight()
  const ascent =
    metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent
  const descent =
    metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent
  const baseline = (ascent - descent) / 2 + lineHeight / 2

  return Math.max(0, baseline - metrics.actualBoundingBoxAscent)
}

function getTextStyleTopInset(style: TextStyle) {
  const measurer = createTextMeasurer(style)

  return getTextNodeTopInset(measurer, measurer)
}

function createBoxTextNode(box: EditorBox, label = box.label) {
  const rect = getBoxRect(box)

  return new Konva.Text({
    align: box.align ?? "center",
    fill: box.color ?? "rgba(0,0,0,1)",
    fontFamily: fontFamilyMap[box.fontFamily ?? "gothic"],
    fontSize: box.fontSize,
    fontStyle: box.bold ? "bold" : "normal",
    lineHeight: 1.4,
    text: label,
    width: box.wrapText ? rect.width : undefined,
    wrap: box.wrapText ? "char" : "none",
  })
}

function TextEditor({
  onClose,
  onChange,
  textNode,
}: {
  onClose: (value: string) => void
  onChange: (value: string) => void
  textNode: Konva.Text
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.value = textNode.text()
    textarea.focus()

    textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`
    textarea.style.height = `${textNode.height() - textNode.padding() * 2 + 5}px`
    textarea.style.fontSize = `${textNode.fontSize()}px`
    textarea.style.fontWeight = textNode.fontStyle().includes("bold")
      ? "700"
      : "400"
    textarea.style.border = "none"
    textarea.style.padding = "0px"
    textarea.style.overflow = "hidden"
    textarea.style.background = "none"
    textarea.style.outline = "none"
    textarea.style.resize = "none"
    textarea.style.lineHeight = `${textNode.lineHeight()}`
    textarea.style.fontFamily = textNode.fontFamily()
    textarea.style.transformOrigin = "left top"
    textarea.style.top = "0px"
    textarea.style.left = "0px"
    textarea.style.textAlign = textNode.align()
    textarea.style.color = textNode.fill().toString()
    textarea.style.overflowWrap =
      textNode.wrap() === "none" ? "normal" : "break-word"
    textarea.style.whiteSpace = textNode.wrap() === "none" ? "pre" : "normal"
    textarea.style.userSelect = "text"
    textarea.style.wordBreak = "normal"

    const close = () => onClose(textarea.value)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close()
      }
    }

    textarea.addEventListener("keydown", handleKeyDown)

    return () => {
      textarea.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, textNode])

  return (
    <Html groupProps={{ x: textNode.x() }}>
      <textarea
        aria-label="Edit text"
        className="absolute m-0 resize-none"
        onBlur={(event) => onClose(event.currentTarget.value)}
        onChange={(event) => onChange(event.currentTarget.value)}
        ref={textareaRef}
      />
    </Html>
  )
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
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  )
  const [editingText, setEditingText] = useState<EditingText | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
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

  useEffect(() => {
    const image = new Image()
    image.src = `/api/projects/${projectId}/image`
    image.onload = () => setImageElement(image)

    return () => {
      image.onload = null
    }
  }, [projectId])

  useEffect(() => {
    if (status !== "ready") {
      return
    }

    setBoxes((current) => {
      const next = current.map((box) => resizeTextBox(box, box.label))

      return next.some((box, index) => box !== current[index]) ? next : current
    })
  }, [setBoxes, status])

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
  const stageScale = Math.min(
    containerSize.width / activeViewBox.width,
    containerSize.height / activeViewBox.height
  )
  const stageOffsetX =
    (containerSize.width - activeViewBox.width * stageScale) / 2
  const stageOffsetY =
    (containerSize.height - activeViewBox.height * stageScale) / 2
  const layerX = stageOffsetX - activeViewBox.x * stageScale
  const layerY = stageOffsetY - activeViewBox.y * stageScale

  function handleWheel(event: Konva.KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault()

    const stage = event.target.getStage()
    const pointer = stage?.getPointerPosition()

    if (!pointer) {
      return
    }

    const pointerX = (pointer.x - layerX) / stageScale
    const pointerY = (pointer.y - layerY) / stageScale
    const nextScale = event.evt.deltaY < 0 ? 0.9 : 1.1
    const nextWidth = Math.min(
      width,
      Math.max(width / 8, activeViewBox.width * nextScale)
    )
    const nextHeight = Math.min(
      height,
      Math.max(height / 8, activeViewBox.height * nextScale)
    )
    const ratioX = (pointerX - activeViewBox.x) / activeViewBox.width
    const ratioY = (pointerY - activeViewBox.y) / activeViewBox.height

    setViewBox({
      height: nextHeight,
      key: currentViewBoxKey,
      width: nextWidth,
      x: clamp(pointerX - ratioX * nextWidth, 0, width - nextWidth),
      y: clamp(pointerY - ratioY * nextHeight, 0, height - nextHeight),
    })
  }

  function resizeTextBox(box: EditorBox, label: string) {
    const nextBox = { ...box, label }
    const textNode = createBoxTextNode(nextBox, label)

    return resizeBboxHeight(
      nextBox.wrapText
        ? nextBox
        : resizeBboxWidth(nextBox, textNode.getTextWidth()),
      textNode.height()
    )
  }

  function updateLabel(index: number, label: string) {
    setBoxes((current) =>
      current.map((box, boxIndex) =>
        boxIndex === index ? resizeTextBox(box, label) : box
      )
    )
    setEditingText(null)
  }

  function updateLabelDraft(index: number, label: string) {
    setBoxes((current) =>
      current.map((box, boxIndex) =>
        boxIndex === index ? resizeTextBox(box, label) : box
      )
    )
  }

  return (
    <div ref={containerRef} className="relative min-h-full overflow-hidden">
      <Stage
        height={containerSize.height}
        onWheel={handleWheel}
        width={containerSize.width}
      >
        <Layer x={layerX} y={layerY} scaleX={stageScale} scaleY={stageScale}>
          <KonvaImage
            height={height}
            image={imageElement ?? undefined}
            width={width}
          />
          {boxes.map((box, index) => {
            const rect = getBoxRect(box)
            const fontFamily = fontFamilyMap[box.fontFamily ?? "gothic"]
            const textNode = createBoxTextNode(box)
            const textWidth = box.wrapText
              ? rect.width
              : textNode.getTextWidth()
            const textX =
              box.wrapText || box.align === "left"
                ? 0
                : box.align === "right"
                  ? rect.width - textWidth
                  : rect.width / 2 - textWidth / 2
            const topInset = getTextStyleTopInset({
              bold: box.bold ?? false,
              fontFamily,
              fontSize: box.fontSize,
            })
            const isActive =
              hoveredIndex === index || editingText?.index === index

            return (
              <Group key={index} x={rect.left} y={rect.top - topInset}>
                {isActive ? (
                  <Rect
                    height={rect.height + 2}
                    listening={false}
                    stroke="#6366f1"
                    strokeWidth={2}
                    width={textWidth + 2}
                    x={textX - 1}
                    y={-1}
                  />
                ) : null}
                <Text
                  align={box.align ?? "center"}
                  fill={box.color ?? "rgba(0,0,0,1)"}
                  fontFamily={fontFamily}
                  fontSize={box.fontSize}
                  fontStyle={box.bold ? "bold" : "normal"}
                  height={rect.height}
                  lineHeight={1.4}
                  onClick={() =>
                    setEditingText({
                      index,
                    })
                  }
                  onTap={() =>
                    setEditingText({
                      index,
                    })
                  }
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  text={box.label}
                  visible={editingText?.index !== index}
                  width={textWidth}
                  wrap={box.wrapText ? "char" : "none"}
                  x={textX}
                  y={0}
                />
                {editingText?.index === index ? (
                  <TextEditor
                    onChange={(value) => updateLabelDraft(index, value)}
                    onClose={(value) => updateLabel(index, value)}
                    textNode={textNode}
                  />
                ) : null}
              </Group>
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}
