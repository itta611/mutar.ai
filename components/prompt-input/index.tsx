"use client"

import { SparklesIcon } from "lucide-react"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthDialog } from "@/hooks/use-auth-dialog"
import { authClient } from "@/lib/auth-client"
import { AspectSelect } from "./aspect-select"
import { ModelSelect } from "./model-select"

const defaultPrompt =
  "SaaSの料金プラン比較を、落ち着いたベージュと黒でまとめた横長スライド。大見出し、3カラム比較表、右下にCTA、洗練されたエディトリアルデザイン。"

type GeneratedImage = {
  id: string
  width: number
  height: number
}

type PromptForm = {
  prompt: string
  aspect: string
  model: string
}

export function PromptInput() {
  const { openAuthDialog } = useAuthDialog()
  const session = authClient.useSession()
  const user = session.data?.user
  const { control, handleSubmit, register, setValue } = useForm<PromptForm>({
    defaultValues: {
      prompt: defaultPrompt,
      aspect: "4:3",
      model: "openai/gpt-5.4-image-2",
    },
  })
  const prompt = useWatch({ control, name: "prompt" })
  const aspect = useWatch({ control, name: "aspect" })
  const model = useWatch({ control, name: "model" })
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate({ prompt, aspect, model }: PromptForm) {
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
          aspectRatio: aspect,
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
    <form
      onSubmit={handleSubmit(handleGenerate)}
      className="mx-auto max-w-200 rounded-2xl border-2 border-indigo-400 p-3.5 shadow-sm"
    >
      <Textarea
        id="generation-prompt"
        {...register("prompt")}
        className="mb-3 min-h-10 resize-none rounded-none border-none px-2 py-0 shadow-none ring-0! outline-none"
        placeholder="作りたい資料画像を自然文で書いてください。"
      />
      <div className="flex items-end justify-between">
        <div className="flex gap-2">
          <AspectSelect
            selectedAspect={aspect}
            onAspectChange={(aspect) => setValue("aspect", aspect)}
          />
          <ModelSelect
            selectedModel={model}
            onModelChange={(model) => setValue("model", model)}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isGenerating || prompt.trim().length === 0}
        >
          <SparklesIcon data-icon="inline-end" />
          {isGenerating ? "生成中" : "生成"}
        </Button>
      </div>
    </form>
  )
}
