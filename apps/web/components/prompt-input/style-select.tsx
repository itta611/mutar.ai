import { ChevronDown, PaletteIcon } from "lucide-react"
import { Button } from "../ui/button"
import { ColorPickerWithInput } from "../ui/color-picker"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Switch } from "../ui/switch"
import Image from "next/image"
import { cn } from "@/lib/utils"

function MenuItem({
  children,
  onClick,
  imageSrc,
  selected = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  imageSrc?: string
  selected?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        `cursor-pointer rounded-lg grow basis-0 p-2 text-center text-xs text-muted-foreground`,
        selected ? "border-2 border-primary" : "border"
      )}
    >
      {imageSrc ? (
        <div className="bg-muted w-full aspect-square rounded-md flex items-center justify-center mb-2">
          <Image
            src={imageSrc}
            className="mx-auto"
            alt=""
            width={26}
            height={26}
          />
        </div>
      ) : null}
      {children}
    </button>
  )
}

export type PromptStyle = {
  themeColor?: string
  transparentBackground: boolean
}

export function StyleSelect({
  style,
  onStyleChange,
}: {
  style: PromptStyle
  onStyleChange: (style: PromptStyle) => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="pr-2">
            <PaletteIcon />
            <span className="not-sm:hidden">スタイル</span>
            <ChevronDown />
          </Button>
        }
      />
      <PopoverContent align="start" className="min-w-90 p-4 gap-3">
        <span className="text-sm text-muted-foreground">テクスチャ</span>
        <div className="grid grid-cols-3 gap-3 pb-1">
          <MenuItem selected>選択しない</MenuItem>

          <MenuItem imageSrc="/knight-flat.png">フラット</MenuItem>
          <MenuItem imageSrc="/knight-gradient.png">立体感</MenuItem>
          <MenuItem imageSrc="/knight-realistic.png">リアル</MenuItem>
        </div>
        <div className="flex items-center justify-between h-9">
          <label
            className="text-sm text-muted-foreground"
            htmlFor="theme-color"
          >
            テーマカラー
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
              onClick={() => onStyleChange({ ...style, themeColor: "#000000" })}
            >
              設定する
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between h-9">
          <label
            className="text-sm text-muted-foreground"
            htmlFor="transparent-background"
          >
            背景を透過
          </label>
          <Switch
            checked={style.transparentBackground}
            className="ml-1"
            id="transparent-background"
            onCheckedChange={(transparentBackground) =>
              onStyleChange({
                ...style,
                transparentBackground: transparentBackground === true,
              })
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
