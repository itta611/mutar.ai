import { ChevronDown, PaletteIcon } from "lucide-react"
import { Button } from "../ui/button"
import { ColorPickerWithInput } from "../ui/color-picker"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Switch } from "../ui/switch"

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
      <PopoverContent align="start" className="min-w-68 p-4 gap-3">
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
