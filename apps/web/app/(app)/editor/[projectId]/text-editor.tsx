"use client"

import Konva from "konva"
import { useEffect, useRef } from "react"
import { Html } from "react-konva-utils"

export function TextEditor({
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
