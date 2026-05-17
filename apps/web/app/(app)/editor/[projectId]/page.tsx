"use client"

import { useAtomValue, useSetAtom } from "jotai"
import Konva from "konva"
import { use, useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  Group,
  Image as KonvaImage,
  Layer,
  Stage,
  Text,
  Transformer,
} from "react-konva"
import { fontFamilyMap } from "@hengen/svg-renderer"

import { TextEditor } from "./text-editor"
import {
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
  type EditorBox,
} from "@/atom/generate"
import { Skeleton } from "@/components/ui/skeleton"
import {
  createBoxTextNode,
  getBoxRect,
  getTextStyleTopInset,
  moveTextBox,
  resizeTextBox,
  resizeWrappedTextBox,
} from "@/hooks/editor-bbox"
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

type EditingText = {
  index: number
}

const defaultViewportPadding = 32
const projectSwitcherHeight = 96

function getImageViewportSize(containerSize: Size) {
  return {
    width: Math.max(1, containerSize.width - defaultViewportPadding * 2),
    height: Math.max(
      1,
      containerSize.height - projectSwitcherHeight - defaultViewportPadding * 2
    ),
  }
}

export default function Page({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  const currentProjectId = useAtomValue(editorProjectIdAtom)
  const activeProjectId = currentProjectId ?? projectId
  const imageSize = useAtomValue(editorImageSizeAtom)
  const boxes = useAtomValue(editorBoxesAtom)
  const setBoxes = useSetAtom(editorBoxesAtom)
  const fetchProject = useEditorProject()
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const textRefs = useRef(new Map<number, Konva.Text>())
  const transformerRef = useRef<Konva.Transformer>(null)
  const [containerSize, setContainerSize] = useState<Size>({
    height: 0,
    width: 0,
  })
  const [imageElement, setImageElement] = useState<{
    image: HTMLImageElement
    projectId: string
  } | null>(null)
  const [editingText, setEditingText] = useState<EditingText | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [stageTransform, setStageTransform] = useState<StageTransform | null>(
    null
  )

  useEffect(() => {
    if (currentProjectId !== activeProjectId) {
      fetchProject(projectId)
    }
  }, [activeProjectId, currentProjectId, fetchProject, projectId])

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
    image.onload = () => setImageElement({ image, projectId: activeProjectId })

    return () => {
      image.onload = null
    }
  }, [activeProjectId])

  useEffect(() => {
    const transformer = transformerRef.current
    const textNode =
      selectedIndex === null || editingText?.index === selectedIndex
        ? null
        : textRefs.current.get(selectedIndex)

    if (!transformer) {
      return
    }

    transformer.nodes(textNode ? [textNode] : [])
    transformer.getLayer()?.batchDraw()
  }, [boxes, editingText?.index, selectedIndex])

  const imageViewportSize = getImageViewportSize(containerSize)

  if (!imageSize || imageElement?.projectId !== activeProjectId) {
    const skeletonScale = Math.min(
      imageViewportSize.width / 4,
      imageViewportSize.height / 3
    )

    return (
      <div className="relative min-h-full" ref={containerRef}>
        <Skeleton
          className="absolute"
          style={{
            height: skeletonScale * 3,
            left:
              defaultViewportPadding +
              (imageViewportSize.width - skeletonScale * 4) / 2,
            top:
              defaultViewportPadding +
              (imageViewportSize.height - skeletonScale * 3) / 2,
            width: skeletonScale * 4,
          }}
        />
      </div>
    )
  }

  const [width, height] = imageSize
  const fitScale = Math.min(
    imageViewportSize.width / width,
    imageViewportSize.height / height
  )
  const stageTransformKey = `${activeProjectId}:${width}:${height}:${containerSize.width}:${containerSize.height}`
  const defaultStageTransform = {
    key: stageTransformKey,
    scale: fitScale,
    x:
      defaultViewportPadding + (imageViewportSize.width - width * fitScale) / 2,
    y:
      defaultViewportPadding +
      (imageViewportSize.height - height * fitScale) / 2,
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

  function updateStageDrag(event: Konva.KonvaEventObject<DragEvent>) {
    if (event.target !== event.currentTarget) {
      return
    }

    setStageTransform({
      ...activeStageTransform,
      x: event.target.x(),
      y: event.target.y(),
    })
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

  function selectText(event: Konva.KonvaEventObject<Event>, index: number) {
    event.cancelBubble = true
    setSelectedIndex(index)
  }

  function startEditing(event: Konva.KonvaEventObject<Event>, index: number) {
    event.cancelBubble = true
    setSelectedIndex(index)
    setEditingText({ index })
  }

  function handleTextDragEnd(
    event: Konva.KonvaEventObject<DragEvent>,
    index: number,
    textX: number
  ) {
    event.cancelBubble = true

    const node = event.target as Konva.Text
    const leftOffset = node.x() - textX
    const topOffset = node.y()

    setBoxes((current) =>
      current.map((box, boxIndex) => {
        if (boxIndex !== index) {
          return box
        }

        const rect = getBoxRect(box)

        return moveTextBox(box, rect.left + leftOffset, rect.top + topOffset)
      })
    )
  }

  function handleTextTransform(
    event: Konva.KonvaEventObject<Event>,
    box: EditorBox,
    textX: number
  ) {
    event.cancelBubble = true

    const node = event.target as Konva.Text
    const width = Math.max(1, node.width() * node.scaleX())
    const leftOffset = node.x() - textX
    const nextBox = resizeWrappedTextBox(
      box,
      getBoxRect(box).left + leftOffset,
      width
    )

    node.scaleX(1)
    node.scaleY(1)
    node.width(width)
    node.height(getBoxRect(nextBox).height)
    node.wrap("char")
    transformerRef.current?.forceUpdate()
  }

  function handleTextTransformEnd(
    event: Konva.KonvaEventObject<Event>,
    index: number,
    textX: number
  ) {
    event.cancelBubble = true

    const node = event.target as Konva.Text
    const width = Math.max(1, node.width() * node.scaleX())
    const leftOffset = node.x() - textX

    setBoxes((current) =>
      current.map((currentBox, boxIndex) => {
        if (boxIndex !== index) {
          return currentBox
        }

        const rect = getBoxRect(currentBox)

        return resizeWrappedTextBox(currentBox, rect.left + leftOffset, width)
      })
    )
  }

  return (
    <div ref={containerRef} className="relative min-h-full overflow-hidden">
      <Stage
        draggable
        height={containerSize.height}
        onDragEnd={updateStageDrag}
        onDragMove={updateStageDrag}
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
            image={imageElement.image}
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
            return (
              <Group key={index} x={rect.left} y={rect.top - topInset}>
                <Text
                  align={box.align ?? "center"}
                  draggable={editingText?.index !== index}
                  fill={box.color ?? "rgba(0,0,0,1)"}
                  fontFamily={fontFamily}
                  fontSize={box.fontSize}
                  fontStyle={box.bold ? "bold" : "normal"}
                  height={rect.height}
                  lineHeight={1.4}
                  onClick={(event) => selectText(event, index)}
                  onDblClick={(event) => startEditing(event, index)}
                  onDblTap={(event) => startEditing(event, index)}
                  onDragEnd={(event) => handleTextDragEnd(event, index, textX)}
                  onDragMove={(event) => {
                    event.cancelBubble = true
                    transformerRef.current?.forceUpdate()
                  }}
                  onDragStart={(event) => selectText(event, index)}
                  onTap={(event) => selectText(event, index)}
                  onTransform={(event) =>
                    handleTextTransform(event, box, textX)
                  }
                  onTransformEnd={(event) =>
                    handleTextTransformEnd(event, index, textX)
                  }
                  ref={(node) => {
                    if (node) {
                      textRefs.current.set(index, node)
                    } else {
                      textRefs.current.delete(index)
                    }
                  }}
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
          <Transformer
            anchorFill="#6366f1"
            anchorStroke="#6366f1"
            borderStroke="#6366f1"
            borderStrokeWidth={1.5}
            enabledAnchors={["middle-left", "middle-right"]}
            flipEnabled={false}
            ref={transformerRef}
            rotateEnabled={false}
          />
        </Layer>
      </Stage>
    </div>
  )
}
