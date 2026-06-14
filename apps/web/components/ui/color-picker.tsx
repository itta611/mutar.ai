"use client"

import { useState } from "react"
import { type HsvColor, HsvColorPicker } from "react-colorful"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function hexToHsv(hex: string): HsvColor {
  const value = Number.parseInt(hex.slice(1), 16)
  const r = ((value >> 16) & 255) / 255
  const g = ((value >> 8) & 255) / 255
  const b = (value & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0

  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h = h * 60
    if (h < 0) h += 360
  }

  return {
    h: Math.round(h),
    s: max === 0 ? 0 : Math.round((delta / max) * 100),
    v: Math.round(max * 100),
  }
}

function hsvToHex({ h, s, v }: HsvColor) {
  const hue = (h % 360) / 60
  const saturation = s / 100
  const brightness = v / 100
  const chroma = brightness * saturation
  const x = chroma * (1 - Math.abs((hue % 2) - 1))
  const match = brightness - chroma
  const [r, g, b] =
    hue < 1
      ? [chroma, x, 0]
      : hue < 2
        ? [x, chroma, 0]
        : hue < 3
          ? [0, chroma, x]
          : hue < 4
            ? [0, x, chroma]
            : hue < 5
              ? [x, 0, chroma]
              : [chroma, 0, x]

  return `#${[r, g, b]
    .map((color) =>
      Math.round((color + match) * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`
}

function ColorPicker({
  className,
  onValueChange,
  value,
}: {
  className?: string
  onValueChange: (value: string) => void
  value: string
}) {
  const [color, setColor] = useState(() => hexToHsv(value))
  const [hexInput, setHexInput] = useState(value)

  function handleChange(nextColor: HsvColor) {
    if (
      nextColor.h < 0 ||
      nextColor.h > 360 ||
      nextColor.s < 0 ||
      nextColor.s > 100 ||
      nextColor.v < 0 ||
      nextColor.v > 100
    ) {
      return
    }

    const hex = hsvToHex(nextColor)
    setColor(nextColor)
    setHexInput(hex)
    onValueChange(hex)
  }

  function handleHexChange() {
    if (!/^#[0-9a-f]{6}$/i.test(hexInput)) return
    const nextColor = hexToHsv(hexInput)
    setColor(nextColor)
    onValueChange(hexInput)
  }

  return (
    <div
      className={cn(
        "space-y-4 rounded-lg bg-popover p-4 [&_.react-colorful]:h-40 [&_.react-colorful]:w-full",
        className
      )}
    >
      <HsvColorPicker color={color} onChange={handleChange} />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">カラーコード</span>
        <Input
          className="w-24 font-mono uppercase"
          onBlur={handleHexChange}
          onChange={(event) => setHexInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleHexChange()
          }}
          value={hexInput}
        />
      </div>
    </div>
  )
}

export { ColorPicker }
