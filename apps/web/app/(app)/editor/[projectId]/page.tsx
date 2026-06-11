"use client"

import { useAtom, useAtomValue, useSetAtom } from "jotai"
import Konva from "konva"
import { use, useEffect, useRef, useState } from "react"
import {
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Text,
  Transformer,
} from "react-konva"

import { EditorStage } from "./editor-stage"
import { TextEditor } from "./text-editor"
import {
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
  editorSelectedBoxIndexAtom,
  fontFamilyMap,
  type EditorBox,
} from "@/atom/generate"
import {
  createBoxTextNode,
  getBoxRect,
  getTextStyleTopInset,
  moveTextBox,
  resizeTextBox,
  resizeWrappedTextBox,
} from "@/hooks/editor-bbox"
import { useEditorProject } from "@/hooks/use-editor-project"

type EditingText = {
  index: number
}

type SnapGuide = {
  direction: "horizontal" | "vertical"
  position: number
}

type SelectionRectangle = {
  x1: number
  x2: number
  y1: number
  y2: number
}

const snapOffset = 5
const textTransformerStyle = {
  anchorStroke: "#6366f1",
  anchorStrokeWidth: 1.5,
  borderStroke: "#6366f1",
  borderStrokeWidth: 1.5,
  flipEnabled: false,
  rotateEnabled: false,
}

function getSnapStops(boxes: EditorBox[], skipIndex: number) {
  return boxes.reduce(
    (stops, box, index) => {
      if (index === skipIndex) {
        return stops
      }

      const rect = getBoxRect(box)

      stops.vertical.push(
        rect.left,
        rect.left + rect.width / 2,
        rect.left + rect.width
      )
      stops.horizontal.push(
        rect.top,
        rect.top + rect.height / 2,
        rect.top + rect.height
      )

      return stops
    },
    { horizontal: [] as number[], vertical: [] as number[] }
  )
}

function snapPoint(value: number, stops: number[]) {
  const closest = stops
    .map((stop) => ({ diff: Math.abs(stop - value), stop }))
    .sort((a, b) => a.diff - b.diff)[0]

  return closest && closest.diff < snapOffset
    ? { guide: closest.stop, value: closest.stop }
    : { guide: null, value }
}

function snapAxis(start: number, size: number, stops: number[]) {
  const points = [
    { offset: 0, value: start },
    { offset: size / 2, value: start + size / 2 },
    { offset: size, value: start + size },
  ]
  const closest = points
    .flatMap((point) =>
      stops.map((stop) => ({
        diff: Math.abs(stop - point.value),
        offset: point.offset,
        stop,
      }))
    )
    .sort((a, b) => a.diff - b.diff)[0]

  return closest && closest.diff < snapOffset
    ? { guide: closest.stop, value: closest.stop - closest.offset }
    : { guide: null, value: start }
}

function snapBoxPosition(
  boxes: EditorBox[],
  index: number,
  rect: { height: number; left: number; top: number; width: number }
) {
  const stops = getSnapStops(boxes, index)
  const x = snapAxis(rect.left, rect.width, stops.vertical)
  const y = snapAxis(rect.top, rect.height, stops.horizontal)

  return {
    guides: [
      ...(x.guide === null
        ? []
        : [{ direction: "vertical" as const, position: x.guide }]),
      ...(y.guide === null
        ? []
        : [{ direction: "horizontal" as const, position: y.guide }]),
    ],
    left: x.value,
    top: y.value,
  }
}

function snapBoxWidth(
  boxes: EditorBox[],
  index: number,
  left: number,
  width: number,
  activeAnchor: string | null
) {
  const stops = getSnapStops(boxes, index)

  if (activeAnchor === "middle-left") {
    const nextLeft = snapPoint(left, stops.vertical)

    return {
      guides:
        nextLeft.guide === null
          ? []
          : [{ direction: "vertical" as const, position: nextLeft.guide }],
      left: nextLeft.value,
      width: Math.max(1, width + left - nextLeft.value),
    }
  }

  if (activeAnchor === "middle-right") {
    const right = snapPoint(left + width, stops.vertical)

    return {
      guides:
        right.guide === null
          ? []
          : [{ direction: "vertical" as const, position: right.guide }],
      left,
      width: Math.max(1, right.value - left),
    }
  }

  return { guides: [] as SnapGuide[], left, width }
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
  const textRefs = useRef(new Map<number, Konva.Text>())
  const hoverTransformerRef = useRef<Konva.Transformer>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const [imageElement, setImageElement] = useState<{
    image: HTMLImageElement
    projectId: string
  } | null>(null)
  const [editingText, setEditingText] = useState<EditingText | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useAtom(editorSelectedBoxIndexAtom)
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([])
  const [selectionRectangle, setSelectionRectangle] =
    useState<SelectionRectangle | null>(null)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)
  const selectionDraggedRef = useRef(false)
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([])

  useEffect(() => {
    if (currentProjectId !== activeProjectId) {
      fetchProject(projectId)
    }
  }, [activeProjectId, currentProjectId, fetchProject, projectId])

  useEffect(() => {
    if (!imageSize) {
      return
    }

    const image = new Image()
    image.src = `/api/projects/${activeProjectId}/image`
    image.onload = () => setImageElement({ image, projectId: activeProjectId })

    return () => {
      image.onload = null
    }
  }, [activeProjectId, imageSize])

  useEffect(() => {
    const transformer = transformerRef.current
    const indexes =
      selectedIndexes.length > 0
        ? selectedIndexes
        : selectedIndex === null && hoveredIndex !== null
          ? [hoveredIndex]
          : []

    if (!transformer) {
      return
    }

    transformer.nodes(
      indexes.flatMap((index) => {
        const node = textRefs.current.get(index)
        return node ? [node] : []
      })
    )
    transformer.getLayer()?.batchDraw()
  }, [
    boxes,
    editingText?.index,
    hoveredIndex,
    selectedIndex,
    selectedIndexes,
  ])

  useEffect(() => {
    const transformer = hoverTransformerRef.current
    const textNode =
      selectedIndex === null ||
      hoveredIndex === null ||
      selectedIndexes.includes(hoveredIndex) ||
      editingText?.index === hoveredIndex
        ? null
        : textRefs.current.get(hoveredIndex)

    if (!transformer) {
      return
    }

    transformer.nodes(textNode ? [textNode] : [])
    transformer.getLayer()?.batchDraw()
  }, [
    boxes,
    editingText?.index,
    hoveredIndex,
    selectedIndex,
    selectedIndexes,
  ])

  function updateLabel(index: number, label: string) {
    setBoxes((current) =>
      current.map((box, boxIndex) =>
        boxIndex === index ? resizeTextBox(box, label) : box
      )
    )
    setEditingText(null)
    setHoveredIndex(null)
    setSelectedIndex(null)
    setSelectedIndexes([])
    setSnapGuides([])
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
    setSelectedIndexes([index])
  }

  function startEditing(event: Konva.KonvaEventObject<Event>, index: number) {
    event.cancelBubble = true
    setSelectedIndex(index)
    setSelectedIndexes([index])
    setEditingText({ index })
  }

  function clearTextSelection(event: Konva.KonvaEventObject<Event>) {
    if (selectionDraggedRef.current) {
      selectionDraggedRef.current = false
      return
    }

    for (
      let node: Konva.Node | null = event.target;
      node;
      node = node.getParent()
    ) {
      if (node === transformerRef.current) {
        return
      }
    }

    if (document.activeElement instanceof HTMLTextAreaElement) {
      document.activeElement.blur()
    }

    setHoveredIndex(null)
    setSelectedIndex(null)
    setSelectedIndexes([])
    setSnapGuides([])
  }

  function startSelection(event: Konva.KonvaEventObject<MouseEvent>) {
    if (event.target !== event.target.getStage()) {
      return
    }

    const position = event.target.getStage()?.getRelativePointerPosition()

    if (!position) {
      return
    }

    selectionStartRef.current = position
    selectionDraggedRef.current = false
    setSelectionRectangle({
      x1: position.x,
      x2: position.x,
      y1: position.y,
      y2: position.y,
    })
  }

  function updateSelection(event: Konva.KonvaEventObject<MouseEvent>) {
    if (!selectionStartRef.current) {
      return
    }

    const position = event.target.getStage()?.getRelativePointerPosition()

    if (!position) {
      return
    }

    selectionDraggedRef.current = true
    setSelectionRectangle((current) =>
      current ? { ...current, x2: position.x, y2: position.y } : null
    )
  }

  function finishSelection(event: Konva.KonvaEventObject<MouseEvent>) {
    const start = selectionStartRef.current
    const stage = event.target.getStage()
    const end = stage?.getRelativePointerPosition()

    if (!start || !stage || !end) {
      return
    }

    selectionStartRef.current = null
    const selectionBox = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    }
    const indexes = boxes.flatMap((_, index) => {
      const node = textRefs.current.get(index)

      return node &&
        Konva.Util.haveIntersection(
          selectionBox,
          node.getClientRect({ relativeTo: stage })
        )
        ? [index]
        : []
    })

    setSelectionRectangle(null)
    setSelectedIndex(indexes[0] ?? null)
    setSelectedIndexes(indexes)
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
        const nextPosition = snapBoxPosition(current, index, {
          ...rect,
          left: rect.left + leftOffset,
          top: rect.top + topOffset,
        })

        node.x(textX)
        node.y(0)

        return moveTextBox(box, nextPosition.left, nextPosition.top)
      })
    )
    setSnapGuides([])
  }

  function handleTextDragMove(
    event: Konva.KonvaEventObject<DragEvent>,
    index: number,
    textX: number
  ) {
    event.cancelBubble = true

    const box = boxes[index]
    const node = event.target as Konva.Text

    if (!box) {
      return
    }

    const rect = getBoxRect(box)
    const nextPosition = snapBoxPosition(boxes, index, {
      ...rect,
      left: rect.left + node.x() - textX,
      top: rect.top + node.y(),
    })

    node.x(textX + nextPosition.left - rect.left)
    node.y(nextPosition.top - rect.top)
    setSnapGuides(nextPosition.guides)
    transformerRef.current?.forceUpdate()
  }

  function handleTextTransform(
    event: Konva.KonvaEventObject<Event>,
    box: EditorBox,
    index: number,
    textX: number
  ) {
    event.cancelBubble = true

    const node = event.target as Konva.Text
    const rect = getBoxRect(box)
    const nextRect = snapBoxWidth(
      boxes,
      index,
      rect.left + node.x() - textX,
      Math.max(1, node.width() * node.scaleX()),
      transformerRef.current?.getActiveAnchor() ?? null
    )
    const nextBox = resizeWrappedTextBox(box, nextRect.left, nextRect.width)

    node.scaleX(1)
    node.scaleY(1)
    node.x(textX + nextRect.left - rect.left)
    node.width(nextRect.width)
    node.height(getBoxRect(nextBox).height)
    node.wrap("char")
    setSnapGuides(nextRect.guides)
    transformerRef.current?.forceUpdate()
  }

  function handleTextTransformEnd(
    event: Konva.KonvaEventObject<Event>,
    index: number,
    textX: number
  ) {
    event.cancelBubble = true

    const node = event.target as Konva.Text

    setBoxes((current) =>
      current.map((currentBox, boxIndex) => {
        if (boxIndex !== index) {
          return currentBox
        }

        const rect = getBoxRect(currentBox)
        const nextRect = snapBoxWidth(
          current,
          index,
          rect.left + node.x() - textX,
          Math.max(1, node.width() * node.scaleX()),
          transformerRef.current?.getActiveAnchor() ?? null
        )

        node.scaleX(1)
        node.scaleY(1)
        node.x(0)

        return resizeWrappedTextBox(currentBox, nextRect.left, nextRect.width)
      })
    )
    setSnapGuides([])
  }

  const [width = 0, height = 0] = imageSize ?? []

  return (
    <EditorStage
      activeProjectId={activeProjectId}
      imageElement={imageElement}
      imageSize={imageSize}
      onClick={clearTextSelection}
      onMouseDown={startSelection}
      onMouseMove={updateSelection}
      onMouseUp={finishSelection}
      onTap={clearTextSelection}
    >
      <Layer>
        {imageElement ? (
          <KonvaImage
            height={height}
            image={imageElement.image}
            listening={false}
            width={width}
          />
        ) : null}
        {boxes.map((box, index) => {
          const rect = getBoxRect(box)
          const fontFamily = fontFamilyMap[box.fontFamily ?? "gothic"]
          const textNode = createBoxTextNode(box)
          const textWidth = box.wrapText ? rect.width : textNode.getTextWidth()
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
            lineheight: box.lineheight ?? 1.4,
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
                letterSpacing={box.letterSpacing ?? 0}
                lineHeight={box.lineheight ?? 1.4}
                onClick={(event) => selectText(event, index)}
                onDblClick={(event) => startEditing(event, index)}
                onDblTap={(event) => startEditing(event, index)}
                onDragEnd={(event) => handleTextDragEnd(event, index, textX)}
                onDragMove={(event) => handleTextDragMove(event, index, textX)}
                onDragStart={(event) => selectText(event, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTap={(event) => selectText(event, index)}
                onTransform={(event) =>
                  handleTextTransform(event, box, index, textX)
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
                  color={box.color ?? "rgba(0,0,0,1)"}
                  fontFamily={fontFamily}
                  fontSize={box.fontSize}
                  fontWeight={box.bold ? 700 : 400}
                  height={rect.height}
                  letterSpacing={box.letterSpacing ?? 0}
                  lineheight={box.lineheight ?? 1.4}
                  onChange={(value) => updateLabelDraft(index, value)}
                  onClose={(value) => updateLabel(index, value)}
                  textAlign={box.align ?? "center"}
                  value={box.label}
                  width={textWidth}
                  wrapText={box.wrapText ?? false}
                  x={textX}
                />
              ) : null}
            </Group>
          )
        })}
        {snapGuides.map((guide) => (
          <Line
            dash={[6, 4]}
            key={`${guide.direction}-${guide.position}`}
            listening={false}
            points={
              guide.direction === "vertical"
                ? [guide.position, 0, guide.position, height]
                : [0, guide.position, width, guide.position]
            }
            stroke="#6366f1"
            strokeWidth={1}
          />
        ))}
        {selectionRectangle ? (
          <Rect
            fill="rgba(59, 130, 246, 0.2)"
            height={Math.abs(selectionRectangle.y2 - selectionRectangle.y1)}
            listening={false}
            stroke="#3b82f6"
            strokeWidth={1}
            width={Math.abs(selectionRectangle.x2 - selectionRectangle.x1)}
            x={Math.min(selectionRectangle.x1, selectionRectangle.x2)}
            y={Math.min(selectionRectangle.y1, selectionRectangle.y2)}
          />
        ) : null}
        <Transformer
          enabledAnchors={
            selectedIndexes.length === 1
              ? ["middle-left", "middle-right"]
              : []
          }
          ref={transformerRef}
          {...textTransformerStyle}
        />
        <Transformer
          enabledAnchors={[]}
          listening={false}
          ref={hoverTransformerRef}
          {...textTransformerStyle}
        />
      </Layer>
    </EditorStage>
  )
}
