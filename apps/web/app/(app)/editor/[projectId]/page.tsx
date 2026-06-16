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
  editorSelectedBoxIndexAtom,
  editorSelectedBoxIndexesAtom,
  fontFamilyMap,
  type EditorBox,
  type ImageSize,
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

  return <Editor key={projectId} projectId={projectId} />
}

function Editor({ projectId }: { projectId: string }) {
  const boxes = useAtomValue(editorBoxesAtom)
  const setBoxes = useSetAtom(editorBoxesAtom)
  const { data: project } = useEditorProject(projectId)
  const isProjectReady = project?.status === "ready"
  const readyProject = isProjectReady ? project : null
  const imageSize: ImageSize | null = readyProject
    ? [readyProject.width, readyProject.height]
    : null
  const textRefs = useRef(new Map<number, Konva.Text>())
  const hoverTransformerRef = useRef<Konva.Transformer>(null)
  const selectionTransformerRefs = useRef(
    new Map<number, Konva.Transformer>()
  )
  const transformerRef = useRef<Konva.Transformer>(null)
  const dragStartPositionsRef = useRef(
    new Map<number, { x: number; y: number }>()
  )
  const [imageElement, setImageElement] = useState<{
    image: HTMLImageElement
    projectId: string
  } | null>(null)
  const [editingText, setEditingText] = useState<EditingText | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [, setSelectedIndex] = useAtom(editorSelectedBoxIndexAtom)
  const [selectedIndexes, setSelectedIndexes] = useAtom(
    editorSelectedBoxIndexesAtom
  )
  const [selectionRectangle, setSelectionRectangle] =
    useState<SelectionRectangle | null>(null)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)
  const selectionDraggedRef = useRef(false)
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([])

  useEffect(() => {
    if (!isProjectReady) {
      return
    }

    const image = new Image()
    image.src = `/api/projects/${projectId}/image`
    image.onload = () => setImageElement({ image, projectId })

    return () => {
      image.onload = null
    }
  }, [isProjectReady, projectId])

  useEffect(() => {
    const transformer = transformerRef.current

    if (!transformer) {
      return
    }

    transformer.nodes([])
    transformer.getLayer()?.batchDraw()

    selectionTransformerRefs.current.forEach((selectionTransformer, index) => {
      const textNode = textRefs.current.get(index)
      selectionTransformer.nodes(textNode ? [textNode] : [])
      selectionTransformer.getLayer()?.batchDraw()
    })
  }, [boxes, selectedIndexes])

  useEffect(() => {
    const transformer = hoverTransformerRef.current
    const textNode =
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

  function getTextTransformer(index: number) {
    return selectionTransformerRefs.current.get(index) ?? transformerRef.current
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
      if (
        node === transformerRef.current ||
        [...selectionTransformerRefs.current.values()].includes(
          node as Konva.Transformer
        )
      ) {
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

  function getIndexesInSelection(
    stage: Konva.Stage,
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) {
    const selectionBox = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    }

    return boxes.flatMap((_, index) => {
      const node = textRefs.current.get(index)

      return node &&
        Konva.Util.haveIntersection(
          selectionBox,
          node.getClientRect({ relativeTo: stage })
        )
        ? [index]
        : []
    })
  }

  function updateSelection(event: Konva.KonvaEventObject<MouseEvent>) {
    const start = selectionStartRef.current
    const stage = event.target.getStage()

    if (!start || !stage) {
      return
    }

    const position = stage.getRelativePointerPosition()

    if (!position) {
      return
    }

    selectionDraggedRef.current = true
    setSelectionRectangle((current) =>
      current ? { ...current, x2: position.x, y2: position.y } : null
    )
    const indexes = getIndexesInSelection(stage, start, position)
    setSelectedIndex(indexes[0] ?? null)
    setSelectedIndexes(indexes)
  }

  function finishSelection(event: Konva.KonvaEventObject<MouseEvent>) {
    const start = selectionStartRef.current
    const stage = event.target.getStage()
    const end = stage?.getRelativePointerPosition()

    if (!start || !stage || !end) {
      return
    }

    selectionStartRef.current = null
    const indexes = getIndexesInSelection(stage, start, end)

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
    const dragStartPositions = dragStartPositionsRef.current
    const start = dragStartPositions.get(index)
    const draggedIndexes = [...dragStartPositions.keys()]
    const leftOffset = node.x() - (start?.x ?? textX)
    const topOffset = node.y() - (start?.y ?? 0)
    const isMultiSelection = draggedIndexes.length > 1

    setBoxes((current) =>
      current.map((box, boxIndex) => {
        if (!draggedIndexes.includes(boxIndex)) {
          return box
        }

        const rect = getBoxRect(box)
        const nextPosition = isMultiSelection
          ? { left: rect.left + leftOffset, top: rect.top + topOffset }
          : snapBoxPosition(current, index, {
              ...rect,
              left: rect.left + leftOffset,
              top: rect.top + topOffset,
            })

        const textNode = textRefs.current.get(boxIndex)
        const position = dragStartPositions.get(boxIndex)
        textNode?.position(position ?? { x: textX, y: 0 })

        return moveTextBox(box, nextPosition.left, nextPosition.top)
      })
    )
    dragStartPositions.clear()
    setSnapGuides([])
  }

  function handleTextDragStart(
    event: Konva.KonvaEventObject<DragEvent>,
    index: number
  ) {
    event.cancelBubble = true

    const indexes = selectedIndexes.includes(index) ? selectedIndexes : [index]

    if (indexes.length === 1) {
      setSelectedIndex(index)
      setSelectedIndexes([index])
    }

    dragStartPositionsRef.current = new Map(
      indexes.flatMap((selectedIndex) => {
        const node = textRefs.current.get(selectedIndex)
        return node
          ? [[selectedIndex, { x: node.x(), y: node.y() }] as const]
          : []
      })
    )
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

    const dragStartPositions = dragStartPositionsRef.current
    const start = dragStartPositions.get(index)

    if (dragStartPositions.size > 1 && start) {
      const x = node.x() - start.x
      const y = node.y() - start.y

      dragStartPositions.forEach((position, selectedIndex) => {
        if (selectedIndex === index) {
          return
        }

        textRefs.current
          .get(selectedIndex)
          ?.position({ x: position.x + x, y: position.y + y })
        getTextTransformer(selectedIndex)?.forceUpdate()
      })
      setSnapGuides([])
      getTextTransformer(index)?.forceUpdate()
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
    getTextTransformer(index)?.forceUpdate()
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
      getTextTransformer(index)?.getActiveAnchor() ?? null
    )
    const nextBox = resizeWrappedTextBox(box, nextRect.left, nextRect.width)

    node.scaleX(1)
    node.scaleY(1)
    node.x(textX + nextRect.left - rect.left)
    node.width(nextRect.width)
    node.height(getBoxRect(nextBox).height)
    node.wrap("char")
    setSnapGuides(nextRect.guides)
    getTextTransformer(index)?.forceUpdate()
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
          getTextTransformer(index)?.getActiveAnchor() ?? null
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
      activeProjectId={projectId}
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
                onDragStart={(event) => handleTextDragStart(event, index)}
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
            strokeScaleEnabled={false}
            strokeWidth={1}
          />
        ))}
        {selectionRectangle ? (
          <Rect
            fill="rgba(59, 130, 246, 0.2)"
            height={Math.abs(selectionRectangle.y2 - selectionRectangle.y1)}
            listening={false}
            stroke="#3b82f6"
            strokeScaleEnabled={false}
            strokeWidth={1}
            width={Math.abs(selectionRectangle.x2 - selectionRectangle.x1)}
            x={Math.min(selectionRectangle.x1, selectionRectangle.x2)}
            y={Math.min(selectionRectangle.y1, selectionRectangle.y2)}
          />
        ) : null}
        <Transformer
          enabledAnchors={[]}
          ref={transformerRef}
          {...textTransformerStyle}
        />
        {selectedIndexes.length > 0
          ? selectedIndexes.map((index) => (
              <Transformer
                enabledAnchors={["middle-left", "middle-right"]}
                key={index}
                ref={(node) => {
                  if (node) {
                    selectionTransformerRefs.current.set(index, node)
                    const textNode = textRefs.current.get(index)
                    node.nodes(textNode ? [textNode] : [])
                  } else {
                    selectionTransformerRefs.current.delete(index)
                  }
                }}
                {...textTransformerStyle}
              />
            ))
          : null}
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
