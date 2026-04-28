import { BotIcon } from "lucide-react"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"

const models = ["Gemini", "GPT-image-2.0"] as const;

export function ModelSelect({
  selectedModel,
  onModelChange,
}: {
  selectedModel: string
  onModelChange: (model: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <BotIcon />
            {selectedModel}
          </Button>
        }
      />
      <DropdownMenuContent>
        {models.map((model) => (
          <DropdownMenuItem key={model} onClick={() => onModelChange(model)}>
            {model}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}