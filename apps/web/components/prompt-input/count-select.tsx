import { Layer, Layers2Icon, Layers2Icons2IconLayers2Icon } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export type ProjectCount = 1 | 2 | 3 | 4

const counts = [1, 2, 3, 4] as const

export function CountSelect({
  selectedCount,
  onCountChange,
}: {
  selectedCount: ProjectCount
  onCountChange: (count: ProjectCount) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <Layers2Icon />
            {selectedCount}枚
          </Button>
        }
      />
      <DropdownMenuContent className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>枚数</DropdownMenuLabel>
          {counts.map((count) => (
            <DropdownMenuItem key={count} onClick={() => onCountChange(count)}>
              <Layers2Icon />
              {count}枚
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
