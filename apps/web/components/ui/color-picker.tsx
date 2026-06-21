"use client"

import { HexColorInput, HexColorPicker } from "react-colorful"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

function ColorPickerWithInput({
  id,
  className,
  onBlur,
  onValueChange,
  value,
  showX = false,
  onXClick,
}: {
  className?: string
  id?: string
  onBlur?: () => void
  onValueChange: (value: string) => void
  value: string
  showX?: boolean
  onXClick?: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.75 bg-zinc-100 dark:bg-zinc-800 rounded-md p-2 h-9",
        showX ? "w-30" : "w-27",
        className
      )}
    >
      <Popover
        onOpenChange={(open) => {
          if (!open) {
            onBlur?.()
          }
        }}
      >
        <PopoverTrigger
          render={
            <button
              aria-label="カラー"
              className="border size-5! rounded-xs"
              style={{ backgroundColor: value }}
              type="button"
            />
          }
        />
        <PopoverContent
          className={cn(
            String.raw`space-y-3 w-auto p-3 bg-popover [&_.react-colorful]:h-auto! [&_.react-colorful\_\_pointer]:border-5! [&_.react-colorful\_\_pointer]:size-5!`,
            String.raw`[&_.react-colorful\_\_saturation]:border-b-0! [&_.react-colorful\_\_saturation]:rounded-lg! [&_.react-colorful\_\_saturation]:h-50!`,
            String.raw`[&_.react-colorful\_\_hue]:rounded-full! [&_.react-colorful\_\_hue]:mt-2! [&_.react-colorful\_\_hue]:border-x-12 [&_.react-colorful\_\_hue]:border-[#ff0000]`
          )}
        >
          <HexColorPicker onChange={onValueChange} color={value} />
        </PopoverContent>
      </Popover>
      <HexColorInput
        className="text-sm grow shrink basis-0 w-0 outline-0 font-mono uppercase"
        color={value}
        id={id}
        onChange={onValueChange}
        onBlur={onBlur}
      />
      {showX && (
        <button type="button" className="cursor-pointer" onClick={onXClick}>
          <XIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  )
}

export { ColorPickerWithInput }
