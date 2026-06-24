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

export function CopyButton({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false)

  function handleCopy() {
    setOpen(false)
    toast("コピーしました")
  }

  return (
    <ButtonGroup aria-label="コピー">
      <Button disabled={disabled} type="button" variant="outline">
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
        <PopoverContent className="w-72 p-0" align="end">
          <Command>
            <CommandList>
              <CommandItem onSelect={handleCopy}>
                <div className="flex flex-col items-start gap-1">
                  <div className="text-foreground text-sm font-bold">
                    画像としてコピー
                  </div>
                  <div className="text-xs">
                    そのまま貼り付けられる画像としてコピー
                  </div>
                </div>
              </CommandItem>
              <CommandItem onSelect={handleCopy}>
                <div className="flex flex-col items-start gap-1">
                  <div className="text-foreground text-sm font-bold">
                    編集可能な形式でコピー
                  </div>
                  <div className="text-xs">
                    対応アプリで編集できる形式としてコピー
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
