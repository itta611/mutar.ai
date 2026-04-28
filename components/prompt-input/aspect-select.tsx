import { ProportionsIcon } from "lucide-react"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

const aspects = [
  { label: "16:9", width: 16, height: 9 },
  { label: "4:3", width: 16, height: 12 },
  { label: "3:4", width: 12, height: 16 },
  { label: "1:1", width: 12, height: 12 },
] as const

export function AspectSelect({
  selectedAspect,
  onAspectChange,
}: {
  selectedAspect: string
  onAspectChange: (aspect: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <ProportionsIcon />
            {selectedAspect}
          </Button>
        }
      />
      <DropdownMenuContent>
        {aspects.map((aspect) => (
          <DropdownMenuItem
            key={aspect.label}
            onClick={() => onAspectChange(aspect.label)}
          >
            <div className="mr-0.5 flex size-4 items-center justify-center">
              <div
                className="rounded-xs border-[1.5px] border-muted-foreground/80"
                style={{ height: aspect.height, width: aspect.width }}
              />
            </div>
            {aspect.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}