"use client"

import { useAtomValue, useSetAtom } from "jotai"
import Konva from "konva"
import { use, useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
} from "react-konva"
import { fontFamilyMap } from "@hengen/svg-renderer"

import { TextEditor } from "./text-editor"
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

type StageTransform = {
  key: string
  x: number
  y: number
  scale: number
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

export default function Page({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  const currentProjectId = useAtomValue(editorProjectIdAtom)
  const activeProjectId = currentProjectId ?? projectId
  const status = useAtomValue(editorProjectStatusAtom)
  const imageSize = useAtomValue(editorImageSizeAtom)
  const boxes = useAtomValue(editorBoxesAtom)
  const setBoxes = useSetAtom(editorBoxesAtom)
  const fetchProject = useEditorProject()
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [containerSize, setContainerSize] = useState<Size>({
    height: 0,
    width: 0,
  })
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  )
  const [editingText, setEditingText] = useState<EditingText | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [stageTransform, setStageTransform] = useState<StageTransform | null>(
    null
  )

  useEffect(() => {
    if (currentProjectId !== activeProjectId || status === null) {
      fetchProject(projectId)
    }
  }, [activeProjectId, currentProjectId, fetchProject, projectId, status])

  useEffect(() => {
    if (status === "ready" || status === "error") {
      return
    }

    const id = window.setInterval(() => {
      fetchProject(activeProjectId)
    }, 5000)

    return () => window.clearInterval(id)
  }, [activeProjectId, fetchProject, status])

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
    image.src = `/api/projects/${activeProjectId}/image`
    image.onload = () => setImageElement(image)

    return () => {
      image.onload = null
    }
  }, [activeProjectId])

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
  const defaultViewportPadding = 32
  const projectSwitcherHeight = 96
  const imageViewportWidth = Math.max(
    1,
    containerSize.width - defaultViewportPadding * 2
  )
  const imageViewportHeight = Math.max(
    1,
    containerSize.height - projectSwitcherHeight - defaultViewportPadding * 2
  )
  const fitScale = Math.min(
    imageViewportWidth / width,
    imageViewportHeight / height
  )
  const stageTransformKey = `${activeProjectId}:${width}:${height}:${containerSize.width}:${containerSize.height}`
  const defaultStageTransform = {
    key: stageTransformKey,
    scale: fitScale,
    x: defaultViewportPadding + (imageViewportWidth - width * fitScale) / 2,
    y: defaultViewportPadding + (imageViewportHeight - height * fitScale) / 2,
  }
  const activeStageTransform =
    stageTransform?.key === stageTransformKey
      ? stageTransform
      : defaultStageTransform

  function handleWheel(event: Konva.KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault()

    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()

    if (!stage || !pointer) {
      return
    }

    const oldScale = stage.scaleX()
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    let direction = event.evt.deltaY > 0 ? -1 : 1

    if (event.evt.ctrlKey) {
      direction = -direction
    }

    const scaleBy = 1.05
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    const scale = Math.max(fitScale / 8, Math.min(fitScale * 16, newScale))

    setStageTransform({
      key: activeStageTransform.key,
      scale,
      x: pointer.x - mousePointTo.x * scale,
      y: pointer.y - mousePointTo.y * scale,
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
        draggable
        height={containerSize.height}
        onDragEnd={(event) =>
          setStageTransform({
            ...activeStageTransform,
            x: event.target.x(),
            y: event.target.y(),
          })
        }
        onDragMove={(event) =>
          setStageTransform({
            ...activeStageTransform,
            x: event.target.x(),
            y: event.target.y(),
          })
        }
        onWheel={handleWheel}
        ref={stageRef}
        scaleX={activeStageTransform.scale}
        scaleY={activeStageTransform.scale}
        width={containerSize.width}
        x={activeStageTransform.x}
        y={activeStageTransform.y}
      >
        <Layer>
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
