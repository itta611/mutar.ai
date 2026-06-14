"use client"

import { HexColorInput, HexColorPicker } from "react-colorful"

import { cn } from "@/lib/utils"

function ColorPicker({
  className,
  onValueChange,
  value,
}: {
  className?: string
  onValueChange: (value: string) => void
  value: string
}) {
  return (
    <div
      className={cn(
        String.raw`space-y-3 bg-popover [&_.react-colorful\_\_pointer]:border-5! [&_.react-colorful\_\_pointer]:size-5!`,
        String.raw`[&_.react-colorful\_\_saturation]:border-b-0! [&_.react-colorful\_\_saturation]:rounded-lg!`,
        String.raw`[&_.react-colorful\_\_hue]:rounded-full! [&_.react-colorful\_\_hue]:mt-2! [&_.react-colorful\_\_hue]:border-x-12 [&_.react-colorful\_\_hue]:border-[#ff0000]`,
        className
      )}
    >
      <HexColorPicker onChange={onValueChange} color={value} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground pl-2">カラーコード</span>
        <HexColorInput
          className={cn(
            "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
            "w-21 font-mono uppercase"
          )}
          color={value}
          onChange={onValueChange}
          prefixed
        />
      </div>
    </div>
  )
}

export { ColorPicker }
