import { ChevronDown, Layers2Icon } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

export function CountSelect({
  selectedCount,
  onCountChange,
}: {
  selectedCount: number
  onCountChange: (count: number) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm">
            <Layers2Icon />
            <span className="not-sm:hidden">{selectedCount}枚</span>
            <ChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>枚数</DropdownMenuLabel>
          <div className="px-1.5 pb-1.5">
            <Tabs
              onValueChange={(value) => onCountChange(Number(value))}
              value={String(selectedCount)}
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
