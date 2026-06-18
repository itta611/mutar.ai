import { ChevronDown, PaletteIcon } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { ColorPickerWithInput } from "../ui/color-picker"
import { Checkbox } from "../ui/checkbox"

export type PromptStyle = {
  themeColor: string
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="pr-2">
            <PaletteIcon />
            <span className="not-sm:hidden">スタイル</span>
            <ChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="min-w-68 grid auto-rows-[36px] grid-cols-[1fr_auto] items-center justify-between gap-y-2 p-4">
        <label className="text-sm text-muted-foreground" htmlFor="theme-color">
          テーマ
        </label>
        <ColorPickerWithInput
          id="theme-color"
          onValueChange={(themeColor) =>
            onStyleChange({ ...style, themeColor })
          }
          value={style.themeColor}
        />
        <label
          className="text-sm text-muted-foreground"
          htmlFor="transparent-background"
        >
          背景を透過
        </label>
        <Checkbox
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
