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
          <Button variant="ghost" size="sm">
            <PaletteIcon />
            <span className="not-sm:hidden">スタイル</span>
            <ChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>スタイル</DropdownMenuLabel>
          <div className="px-1.5 pb-1.5">
            <Tabs
              onValueChange={(value) => onStyleChange(Number(value))}
              value={String(selectedStyle)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="1">1</TabsTrigger>
                <TabsTrigger value="2">2</TabsTrigger>
                <TabsTrigger value="3">3</TabsTrigger>
                <TabsTrigger value="4">4</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
