import { BotIcon } from "lucide-react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

const models = [
  {
    label: "gpt-5.4-image-2",
    value: "openai/gpt-5.4-image-2",
  },
  {
    label: "gemini-2.5-flash-image",
    value: "google/gemini-2.5-flash-image",
  },
] as const

export function ModelSelect({
  selectedModel,
  onModelChange,
}: {
  selectedModel: string
  onModelChange: (model: string) => void
}) {
  const selectedModelLabel =
    models.find((model) => model.value === selectedModel)?.label ??
    selectedModel

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <BotIcon />
            {selectedModelLabel}
          </Button>
        }
      />
      <DropdownMenuContent className="w-max">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.value}
            onClick={() => onModelChange(model.value)}
          >
            {model.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
