"use client"

import { useAtomValue, useSetAtom } from "jotai"
import Konva from "konva"
import { use, useEffect, useRef, useState } from "react"
import {
  Group,
  Image as KonvaImage,
  Layer,
  Text,
  Transformer,
} from "react-konva"
import { fontFamilyMap } from "@hengen/svg-renderer"

import { EditorStage } from "./editor-stage"
import { TextEditor } from "./text-editor"
import {
  editorBoxesAtom,
  editorImageSizeAtom,
  editorProjectIdAtom,
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
  const transformerRef = useRef<Konva.Transformer>(null)
  const [imageElement, setImageElement] = useState<{
    image: HTMLImageElement
    projectId: string
  } | null>(null)
  const [editingText, setEditingText] = useState<EditingText | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (currentProjectId !== activeProjectId) {
      fetchProject(projectId)
    }
  }, [activeProjectId, currentProjectId, fetchProject, projectId])

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
    const transformerIndex = selectedIndex ?? hoveredIndex
    const textNode =
      transformerIndex === null || editingText?.index === transformerIndex
        ? null
        : textRefs.current.get(transformerIndex)

    if (!transformer) {
      return
    }

    transformer.nodes(textNode ? [textNode] : [])
    transformer.getLayer()?.batchDraw()
  }, [boxes, editingText?.index, hoveredIndex, selectedIndex])

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

  const [width = 0, height = 0] = imageSize ?? []

  return (
    <EditorStage
      activeProjectId={activeProjectId}
      imageElement={imageElement}
      imageSize={imageSize}
    >
      <Layer>
        {imageElement ? (
          <KonvaImage height={height} image={imageElement.image} width={width} />
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
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTap={(event) => selectText(event, index)}
                onTransform={(event) => handleTextTransform(event, box, textX)}
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
        <Transformer
          anchorStroke="#6366f1"
          borderStroke="#6366f1"
          borderStrokeWidth={1.5}
          enabledAnchors={
            selectedIndex === null ? [] : ["middle-left", "middle-right"]
          }
          flipEnabled={false}
          ref={transformerRef}
          rotateEnabled={false}
        />
      </Layer>
    </EditorStage>
  )
}
