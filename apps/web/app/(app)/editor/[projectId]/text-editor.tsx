"use client"

import { Html } from "react-konva-utils"

export function TextEditor({
  color,
  fontFamily,
  fontSize,
  fontWeight,
  height,
  letterSpacing,
  lineheight,
  onClose,
  onChange,
  textAlign,
  value,
  width,
  wrapText,
  x,
}: {
  color: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  height: number
  letterSpacing: number
  lineheight: number
  onClose: (value: string) => void
  onChange: (value: string) => void
  textAlign: "left" | "center" | "right"
  value: string
  width: number
  wrapText: boolean
  x: number
}) {
  return (
    <Html groupProps={{ x }}>
      <textarea
        aria-label="Edit text"
        autoFocus
        className="absolute m-0 resize-none"
        onBlur={(event) => onClose(event.currentTarget.value)}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onClose(event.currentTarget.value)
          }
        }}
        style={{
          background: "none",
          border: "none",
          color,
          fontFamily,
          fontSize,
          fontWeight,
          height: height + 5,
          left: 0,
          letterSpacing,
          lineHeight: lineheight,
          outline: "none",
          overflow: "hidden",
          overflowWrap: wrapText ? "break-word" : "normal",
          padding: 0,
          resize: "none",
          textAlign,
          top: 0,
          transformOrigin: "left top",
          userSelect: "text",
          whiteSpace: wrapText ? "normal" : "pre",
          width,
          wordBreak: "normal",
        }}
        defaultValue={value}
      />
    </Html>
  )
}
