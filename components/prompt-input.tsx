"use client"

import { BotIcon, ProportionsIcon, SparklesIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthDialog } from "@/hooks/use-auth-dialog"
import { authClient } from "@/lib/auth-client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

const defaultPrompt =
  "SaaSの料金プラン比較を、落ち着いたベージュと黒でまとめた横長スライド。大見出し、3カラム比較表、右下にCTA、洗練されたエディトリアルデザイン。"
const aspects = [
  { label: "16:9", width: 16, height: 9 },
  { label: "4:3", width: 16, height: 12 },
  { label: "3:4", width: 12, height: 16 },
  { label: "1:1", width: 12, height: 12 },
]
const models = ["Gemini", "GPT-image-2.0"] as const

type GeneratedImage = {
  id: string
  width: number
  height: number
}

function AspectSelect({
  selectedAspect,
  onAspectChange,
}: {
  selectedAspect: number
  onAspectChange: (aspect: number) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <ProportionsIcon />
            {aspects[selectedAspect].label}
          </Button>
        }
      />
      <DropdownMenuContent>
        {aspects.map((aspect, index) => (
          <DropdownMenuItem
            key={aspect.label}
            onClick={() => onAspectChange(index)}
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

function ModelSelect({
  selectedModel,
  onModelChange,
}: {
  selectedModel: (typeof models)[number]
  onModelChange: (model: (typeof models)[number]) => void
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

export function PromptInput() {
  const { openAuthDialog } = useAuthDialog()
  const session = authClient.useSession()
  const user = session.data?.user
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aspect, setAspect] = useState(0)
  const [model, setModel] = useState<(typeof models)[number]>("GPT-image-2.0")

  async function handleGenerate() {
    if (!user) {
      openAuthDialog()
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          aspectRatio: aspects[aspect].label,
          model,
        }),
      })

      if (!response.ok) {
        throw new Error("generate_failed")
      }

      const data = (await response.json()) as GeneratedImage & {
        projectId: string
      }

      window.dispatchEvent(
        new CustomEvent<GeneratedImage>("generated-image-created", {
          detail: {
            id: data.projectId,
            width: data.width,
            height: data.height,
          },
        })
      )
    } catch {
    } finally {
      setIsGenerating(false)
    }
  }
  return (
    <div className="rounded-2xl border-2 border-indigo-400 p-3.5 shadow-sm">
      <Textarea
        id="generation-prompt"
        name="prompt"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        className="mb-3 min-h-10 resize-none rounded-none border-none px-2 py-0 shadow-none ring-0! outline-none"
        placeholder="作りたい資料画像を自然文で書いてください。"
      />
      <div className="flex items-end justify-between">
        <div className="flex gap-2">
          <AspectSelect selectedAspect={aspect} onAspectChange={setAspect} />
          <ModelSelect selectedModel={model} onModelChange={setModel} />
        </div>
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || prompt.trim().length < 12}
        >
          <SparklesIcon data-icon="inline-end" />
          {isGenerating ? "生成中" : "生成"}
        </Button>
      </div>
    </div>
  )
}
