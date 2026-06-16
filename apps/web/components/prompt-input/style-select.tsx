import { ChevronDown, PaletteIcon } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

export function StyleSelect({
  selectedStyle,
  onStyleChange,
}: {
  selectedStyle: number
  onStyleChange: (style: number) => void
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
      <DropdownMenuContent className="min-w-48">
        <div className="flex-col p-1.5">{/* <div className="f" */}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
