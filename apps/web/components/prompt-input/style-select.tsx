import { ChevronDown, CircleSlashIcon, PaletteIcon } from "lucide-react"
import { Button } from "../ui/button"
import { ColorPickerWithInput } from "../ui/color-picker"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import Image from "next/image"
import { cn } from "@/lib/utils"

function MenuItem({
  children,
  onClick,
  label,
  selected = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  label: string
  selected?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer grow basis-0 text-xs text-muted-foreground outline-none group"
    >
      <div
        className={cn(
          "bg-primary/7 w-full aspect-square rounded-lg flex items-center justify-center mb-2 group-focus-visible:border-2 group-focus-visible:border-primary",
          { "border-2 border-primary": selected }
        )}
      >
        {children}
      </div>
      {label}
    </button>
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
  soft: "ふっくら",
  realistic: "リアル",
} satisfies Record<NonNullable<PromptStyle["texture"]>, string>

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
            <span className="not-sm:hidden">
              {style.texture ? textureLabels[style.texture] : "スタイル"}
            </span>
            <ChevronDown />
          </Button>
        }
      />
      <PopoverContent align="start" className="min-w-80 p-4 gap-3">
        <span className="text-sm text-muted-foreground">テクスチャ</span>
        <div className="grid grid-cols-3 gap-4 pb-1">
          <MenuItem
            selected={!style.texture}
            label="選択しない"
            onClick={() => onStyleChange({ ...style, texture: undefined })}
          >
            <CircleSlashIcon className="text-indigo-500 dark:indigo-500" />
            {/* <CircleSlashIcon className="text-zinc-400 dark:text-zinc-500" /> */}
          </MenuItem>
          <MenuItem
            selected={style.texture === "flat"}
            label="フラット"
            onClick={() => onStyleChange({ ...style, texture: "flat" })}
          >
            <Image
              src="/knight-flat.png"
              className="mx-auto"
              alt=""
              width={30}
              height={30}
            />
          </MenuItem>
          <MenuItem
            selected={style.texture === "outline"}
            label="アウトライン"
            onClick={() => onStyleChange({ ...style, texture: "outline" })}
          >
            <Image
              src="/knight-outline.png"
              className="mx-auto"
              alt=""
              width={30}
              height={30}
            />
          </MenuItem>
          <MenuItem
            selected={style.texture === "soft"}
            label="ふっくら"
            onClick={() => onStyleChange({ ...style, texture: "soft" })}
          >
            <Image
              src="/knight-gradient.png"
              className="mx-auto"
              alt=""
              width={30}
              height={30}
            />
          </MenuItem>
          <MenuItem
            selected={style.texture === "realistic"}
            label="リアル"
            onClick={() => onStyleChange({ ...style, texture: "realistic" })}
          >
            <Image
              src="/knight-realistic.png"
              className="mx-auto"
              alt=""
              width={30}
              height={30}
            />
          </MenuItem>
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
