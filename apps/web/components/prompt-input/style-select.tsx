import { ChevronDown, CircleSlashIcon, PaletteIcon } from "lucide-react"
import { Button } from "../ui/button"
import { ColorPickerWithInput } from "../ui/color-picker"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

type RGB = [number, number, number]

function MenuItem({
  children,
  onClick,
  label,
  backgroundColor,
  selected = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  label: string
  backgroundColor?: RGB
  selected: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer grow basis-0 text-xs text-muted-foreground outline-none group"
    >
      <div
        className={cn(
          "w-full aspect-square rounded-lg flex items-center justify-center mb-1.5 group-focus-visible:border-2 border-primary",
          { "border-2": selected },
          { "bg-muted/60": !backgroundColor }
        )}
        style={{
          background: backgroundColor
            ? `linear-gradient(0deg, ${toRGBAString(backgroundColor, 0.06)} 0%, ${toRGBAString(backgroundColor, 0)} 50%)`
            : undefined,
        }}
      >
        {children}
      </div>
      {label}
    </button>
  )
}

function toRGBAString(rgb: RGB, alpha = 1) {
  return `rgba(${rgb.map((value) => Math.round(value * 255)).join(", ")}, ${alpha})`
}

function getDisplayColor(
  color: string,
  valueFromSaturation?: (saturation: number) => number
) {
  const hex = color.replace("#", "")
  const values: RGB = /^[\dA-Fa-f]{6}$/.test(hex)
    ? ([0, 2, 4].map(
        (index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255
      ) as RGB)
    : [99 / 255, 102 / 255, 241 / 255]
  const [red, green, blue] = values
  const max = Math.max(...values)
  const min = Math.min(...values)
  const delta = max - min
  let hue = 0

  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6
    else if (max === green) hue = (blue - red) / delta + 2
    else hue = (red - green) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
  }

  const hsvSaturation = max === 0 ? 0 : delta / max
  const hsvValue = valueFromSaturation
    ? valueFromSaturation(hsvSaturation)
    : Math.min(0.9, Math.max(0.3, max))
  const hsvChroma = hsvValue * Math.min(0.7, hsvSaturation)
  const hsvX = hsvChroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const hsvMatch = hsvValue - hsvChroma
  const rgbOffsets: RGB =
    hue < 60
      ? [hsvChroma, hsvX, 0]
      : hue < 120
        ? [hsvX, hsvChroma, 0]
        : hue < 180
          ? [0, hsvChroma, hsvX]
          : hue < 240
            ? [0, hsvX, hsvChroma]
            : hue < 300
              ? [hsvX, 0, hsvChroma]
              : [hsvChroma, 0, hsvX]
  return rgbOffsets.map((value) => value + hsvMatch) as RGB
}

function TextureImage({
  src,
  hasShadow,
}: {
  src: string
  hasShadow?: boolean
}) {
  return (
    <Image
      src={src}
      alt=""
      width={30}
      height={30}
      className="pointer-events-none"
      style={{
        filter: hasShadow
          ? "url(#texture-color-filter) drop-shadow(0px 0px 8px rgb(0 0 0 / 10%))"
          : "url(#texture-color-filter)",
      }}
    />
  )
}

export type PromptStyle = {
  texture?: "flat" | "outline" | "soft" | "realistic"
  themeColor?: string
  backgroundColor?: string
}

const textureLabels = {
  flat: "フラット",
  outline: "アウトライン",
  soft: "ソフト",
  realistic: "リアル",
} satisfies Record<NonNullable<PromptStyle["texture"]>, string>

export function StyleSelect({
  style,
  onStyleChange,
}: {
  style: PromptStyle
  onStyleChange: (style: PromptStyle) => void
}) {
  const [open, setOpen] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const themeColor = style.themeColor ?? "#6366F1"
  const displayColor = getDisplayColor(themeColor)
  const backgroundColor = getDisplayColor(
    themeColor,
    (saturation) => 0.5 + saturation * 0.5
  )
  const [red, green, blue] = displayColor
  const baseLuminance =
    0.2126 * (99 / 255) + 0.7152 * (102 / 255) + 0.0722 * (241 / 255)
  const shade = 0.75

  return (
    <Popover
      open={open}
      onOpenChange={(open, eventDetails) => {
        if (
          !open &&
          eventDetails.reason === "outside-press" &&
          colorPickerOpen
        ) {
          return
        }

        setOpen(open)
        if (!open) {
          setColorPickerOpen(false)
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="pr-2">
            <PaletteIcon />
            <span className="not-sm:hidden">
              {style.texture ? textureLabels[style.texture] : "スタイル"}
            </span>
            <ChevronDown />
          </Button>
        }
      />
      <PopoverContent align="start" className="min-w-80 p-4 gap-3">
        {/** biome-ignore lint/a11y/noSvgWithoutTitle: SVG Filter */}
        <svg className="absolute size-0" aria-hidden>
          <filter id="texture-color-filter" colorInterpolationFilters="sRGB">
            <feColorMatrix
              values={`${0.2126 * shade} ${0.7152 * shade} ${0.0722 * shade} 0 ${red - baseLuminance * shade}
                ${0.2126 * shade} ${0.7152 * shade} ${0.0722 * shade} 0 ${green - baseLuminance * shade}
                ${0.2126 * shade} ${0.7152 * shade} ${0.0722 * shade} 0 ${blue - baseLuminance * shade}
                0 0 0 1 0`}
            />
          </filter>
        </svg>
        <span className="text-sm text-muted-foreground">テクスチャ</span>
        <div className="grid grid-cols-3 gap-4 pb-1">
          <MenuItem
            selected={!style.texture}
            label="選択しない"
            onClick={() => onStyleChange({ ...style, texture: undefined })}
          >
            <CircleSlashIcon
              className={
                style.texture ? "text-muted-foreground" : "text-primary"
              }
            />
          </MenuItem>
          <MenuItem
            backgroundColor={backgroundColor}
            selected={style.texture === "flat"}
            label="フラット"
            onClick={() => onStyleChange({ ...style, texture: "flat" })}
          >
            <TextureImage src="/knight-flat.png" />
          </MenuItem>
          <MenuItem
            backgroundColor={backgroundColor}
            selected={style.texture === "outline"}
            label="アウトライン"
            onClick={() => onStyleChange({ ...style, texture: "outline" })}
          >
            <TextureImage src="/knight-outline.png" />
          </MenuItem>
          <MenuItem
            backgroundColor={backgroundColor}
            selected={style.texture === "soft"}
            label="ソフト"
            onClick={() => onStyleChange({ ...style, texture: "soft" })}
          >
            <TextureImage src="/knight-gradient.png" hasShadow />
          </MenuItem>
          <MenuItem
            backgroundColor={backgroundColor}
            selected={style.texture === "realistic"}
            label="リアル"
            onClick={() => onStyleChange({ ...style, texture: "realistic" })}
          >
            <TextureImage src="/knight-realistic.png" hasShadow />
          </MenuItem>
        </div>
        <div className="flex items-center justify-between h-9">
          <label
            className="text-sm text-muted-foreground"
            htmlFor="theme-color"
          >
            テーマ
          </label>
          {style.themeColor ? (
            <ColorPickerWithInput
              id="theme-color"
              onValueChange={(themeColor) =>
                onStyleChange({ ...style, themeColor })
              }
              className="border bg-background"
              value={style.themeColor}
              showX
              onXClick={() =>
                onStyleChange({ ...style, themeColor: undefined })
              }
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => onStyleChange({ ...style, themeColor: "#6366F1" })}
            >
              設定する
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between h-9">
          <label
            className="text-sm text-muted-foreground"
            htmlFor="background-color"
          >
            背景色
          </label>
          {style.backgroundColor ? (
            <ColorPickerWithInput
              id="background-color"
              onValueChange={(backgroundColor) =>
                onStyleChange({ ...style, backgroundColor })
              }
              className="border bg-background"
              value={style.backgroundColor}
              showX
              onXClick={() =>
                onStyleChange({ ...style, backgroundColor: undefined })
              }
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() =>
                onStyleChange({ ...style, backgroundColor: "#FFFFFF" })
              }
            >
              設定する
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
