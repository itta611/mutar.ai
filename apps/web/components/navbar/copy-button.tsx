import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { toast } from "sonner"

export function CopyButton({ disabled }: { disabled: boolean }) {
  return (
    <ButtonGroup aria-label="コピー">
      <Button disabled={disabled} type="button" variant="outline">
        コピー
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
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
        <DropdownMenuContent className="w-64 p-2" align="end">
          <DropdownMenuItem
            onSelect={() => toast("コピーしました")}
            className="flex-col items-start gap-1.5"
          >
            <div className="text-foreground text-sm font-bold">
              画像としてコピー
            </div>
            <div className="text-xs">
              画像形式でクリップボードにコピーします。
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => toast("コピーしました")}
            className="flex-col items-start gap-1.5"
          >
            <div className="text-foreground text-sm font-bold">
              XXとしてコピー
            </div>
            <div className="text-xs">
              PowerPoint等に貼り付け可能な形式でコピーします。
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
