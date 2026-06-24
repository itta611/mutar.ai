"use client"

import { ChevronDownIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Command,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function CopyButton({
  disabled,
  onCopyImage,
  onCopySvg,
}: {
  disabled: boolean
  onCopyImage: () => Promise<void>
  onCopySvg: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  async function handleCopy(action: () => Promise<void>) {
    try {
      await action()
      setOpen(false)
    } catch {
      toast.error("コピーに失敗しました")
    }
  }

  return (
    <ButtonGroup aria-label="コピー">
      <Button
        disabled={disabled}
        onClick={() => handleCopy(onCopyImage)}
        type="button"
        variant="outline"
      >
        コピー
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              aria-label="コピーオプション"
              className="w-7"
              disabled={disabled}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronDownIcon />
            </Button>
          }
        />
        <PopoverContent className="w-73 p-0" align="end">
          <Command>
            <CommandList>
              <CommandItem onSelect={() => handleCopy(onCopyImage)}>
                <div className="flex flex-col items-start gap-1">
                  <div className="text-foreground text-xs font-bold">
                    画像としてコピー
                  </div>
                  <div className="text-xs text-muted-foreground">
                    画像形式でコピーします。
                  </div>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => handleCopy(onCopySvg)}>
                <div className="flex flex-col items-start gap-1">
                  <div className="text-foreground text-xs font-bold">
                    SVG形式でコピー
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Powerpoint等で編集できる形式でコピーします。
                  </div>
                </div>
              </CommandItem>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  )
}
