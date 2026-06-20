"use client"

import { HexColorInput, HexColorPicker } from "react-colorful"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

function ColorPicker({
  className,
  onBlur,
  onValueChange,
  value,
}: {
  className?: string
  id?: string
  onBlur?: () => void
  onValueChange: (value: string) => void
  value: string
}) {
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) {
          onBlur?.()
        }
      }}
    >
      <DropdownMenuTrigger
        render={
          <button
            aria-label="カラー"
            className="border size-5! rounded-sm"
            style={{ backgroundColor: value }}
            type="button"
          />
        }
      />
      <DropdownMenuContent
        className={cn(
          String.raw`space-y-3 w-auto p-3 bg-popover [&_.react-colorful]:h-auto! [&_.react-colorful\_\_pointer]:border-5! [&_.react-colorful\_\_pointer]:size-5!`,
          String.raw`[&_.react-colorful\_\_saturation]:border-b-0! [&_.react-colorful\_\_saturation]:rounded-lg! [&_.react-colorful\_\_saturation]:h-50!`,
          String.raw`[&_.react-colorful\_\_hue]:rounded-full! [&_.react-colorful\_\_hue]:mt-2! [&_.react-colorful\_\_hue]:border-x-12 [&_.react-colorful\_\_hue]:border-[#ff0000]`,
          className
        )}
      >
        <HexColorPicker onChange={onValueChange} color={value} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground pl-1">
            カラーコード
          </span>
          <HexColorInput
            className={cn(
              "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
              "w-21 font-mono uppercase"
            )}
            color={value}
            onChange={onValueChange}
            onBlur={onBlur}
            prefixed
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ColorPickerWithInput({
  id,
  className,
  onBlur,
  onValueChange,
  value,
}: Parameters<typeof ColorPicker>[0]) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.75 w-27 bg-zinc-100 dark:bg-zinc-800 rounded-md p-2 h-9",
        className
      )}
    >
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) {
            onBlur?.()
          }
        }}
      >
        <DropdownMenuTrigger
          render={
            <button
              aria-label="カラー"
              className="border size-5! rounded-xs"
              style={{ backgroundColor: value }}
              type="button"
            />
          }
        />
        <DropdownMenuContent
          className={cn(
            String.raw`space-y-3 w-auto p-3 bg-popover [&_.react-colorful]:h-auto! [&_.react-colorful\_\_pointer]:border-5! [&_.react-colorful\_\_pointer]:size-5!`,
            String.raw`[&_.react-colorful\_\_saturation]:border-b-0! [&_.react-colorful\_\_saturation]:rounded-lg! [&_.react-colorful\_\_saturation]:h-50!`,
            String.raw`[&_.react-colorful\_\_hue]:rounded-full! [&_.react-colorful\_\_hue]:mt-2! [&_.react-colorful\_\_hue]:border-x-12 [&_.react-colorful\_\_hue]:border-[#ff0000]`
          )}
        >
          <HexColorPicker onChange={onValueChange} color={value} />
        </DropdownMenuContent>
      </DropdownMenu>
      <HexColorInput
        className="text-sm grow shrink basis-0 w-0 outline-0 font-mono uppercase"
        color={value}
        id={id}
        onChange={onValueChange}
        onBlur={onBlur}
      />
    </div>
  )
}

export { ColorPicker, ColorPickerWithInput }
