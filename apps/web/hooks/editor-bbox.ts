"use client"

import Konva from "konva"

import { fontFamilyMap, type EditorBox } from "@/atom/generate"

type TextStyle = {
  bold: boolean
  fontFamily: string
  fontSize: number
  lineheight: number
}

export function getBoxRect(box: EditorBox) {
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

function updateBboxRect(
  box: EditorBox,
  rect: { height: number; left: number; top: number; width: number }
): EditorBox {
  const current = getBoxRect(box)

  return {
    ...box,
    bbox: box.bbox.map((point) => ({
      ...point,
      x:
        rect.left +
        (current.width > 0
          ? (((point.x ?? current.left) - current.left) / current.width) *
            rect.width
          : 0),
      y:
        rect.top +
        (current.height > 0
          ? (((point.y ?? current.top) - current.top) / current.height) *
            rect.height
          : 0),
    })),
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

  return updateBboxRect(box, { ...rect, left: nextLeft, width: nextWidth })
}

function resizeBboxHeight(box: EditorBox, height: number): EditorBox {
  const rect = getBoxRect(box)
  const nextHeight = Math.max(1, Math.ceil(height))

  if (Math.ceil(rect.height) === nextHeight) {
    return box
  }

  return updateBboxRect(box, { ...rect, height: nextHeight })
}

function createTextMeasurer(style: TextStyle) {
  return new Konva.Text({
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontStyle: style.bold ? "bold" : "normal",
    lineHeight: style.lineheight,
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

export function getTextStyleTopInset(style: TextStyle) {
  const measurer = createTextMeasurer(style)

  return getTextNodeTopInset(measurer, measurer)
}

export function createBoxTextNode(box: EditorBox, label = box.label) {
  const rect = getBoxRect(box)

  return new Konva.Text({
    align: box.align ?? "center",
    fill: box.color ?? "rgba(0,0,0,1)",
    fontFamily: fontFamilyMap[box.fontFamily ?? "gothic"],
    fontSize: box.fontSize,
    fontStyle: box.bold ? "bold" : "normal",
    letterSpacing: box.letterSpacing ?? 0,
    lineHeight: box.lineheight ?? 1.4,
    text: label,
    width: box.wrapText ? rect.width : undefined,
    wrap: box.wrapText ? "char" : "none",
  })
}

export function resizeTextBox(box: EditorBox, label: string) {
  const nextBox = { ...box, label }
  const textNode = createBoxTextNode(nextBox, label)

  return resizeBboxHeight(
    nextBox.wrapText
      ? nextBox
      : resizeBboxWidth(nextBox, textNode.getTextWidth()),
    textNode.height()
  )
}

export function moveTextBox(box: EditorBox, left: number, top: number) {
  const rect = getBoxRect(box)

  return updateBboxRect(box, { ...rect, left, top })
}

export function resizeWrappedTextBox(
  box: EditorBox,
  left: number,
  width: number
) {
  const rect = getBoxRect(box)
  const nextBox = updateBboxRect(
    { ...box, wrapText: true },
    {
      ...rect,
      left,
      width: Math.max(1, Math.ceil(width)),
    }
  )

  return resizeBboxHeight(nextBox, createBoxTextNode(nextBox).height())
}
