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
        <DropdownMenuContent className="w-72 p-1.5" align="end">
          <DropdownMenuItem
            onSelect={() => toast("コピーしました")}
            className="flex-col items-start gap-1"
          >
            <div className="text-foreground text-sm font-bold">
              画像としてコピー
            </div>
            <div className="text-xs">そのまま貼り付けられる画像としてコピー</div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => toast("コピーしました")}
            className="flex-col items-start gap-1"
          >
            <div className="text-foreground text-sm font-bold">
              編集可能な形式でコピー
            </div>
            <div className="text-xs">対応アプリで編集できる形式としてコピー</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
