"use client"

import { SparklesIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthDialog } from "@/hooks/use-auth-dialog"
import { useGenerateProject } from "@/hooks/use-generate-project"
import { authClient } from "@/lib/auth-client"
import { AspectSelect } from "./aspect-select"
import { ModelSelect } from "./model-select"

const defaultPrompt =
  "SaaSの料金プラン比較を、落ち着いたベージュと黒でまとめた横長スライド。大見出し、3カラム比較表、右下にCTA、洗練されたエディトリアルデザイン。"

export function PromptInput() {
  const generateProject = useGenerateProject()
  const { openAuthDialog } = useAuthDialog()
  const router = useRouter()
  const session = authClient.useSession()
  const user = session.data?.user
  const { control, handleSubmit, register, setValue } = useForm({
    defaultValues: {
      prompt: defaultPrompt,
      aspectRatio: "4:3",
      model: "openai/gpt-5.4-image-2",
    },
  })
  const prompt = useWatch({ control, name: "prompt" })
  const aspect = useWatch({ control, name: "aspectRatio" })
  const model = useWatch({ control, name: "model" })
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate(options: {
    prompt: string
    aspectRatio: string
    model: string
  }) {
    if (!user) {
      openAuthDialog()
      return
    }

    setIsGenerating(true)

    try {
      const projectId = await generateProject(options)
      router.push(`/editor/${projectId}`)
    } catch {
      setIsGenerating(false)
    }
  }
  return (
    <form
      onSubmit={handleSubmit(handleGenerate)}
      className="mx-auto max-w-200 rounded-2xl border-2 border-primary p-3.5 shadow-lg/6 bg-background dark:bg-secondary"
    >
      <Textarea
        id="generation-prompt"
        {...register("prompt")}
        className="min-h-10 resize-none rounded-none border-none px-2 pt-0 pb-2 shadow-none ring-0! outline-none leading-relaxed bg-transparent!"
        placeholder="作りたい資料画像を自然文で書いてください。"
      />
      <div className="flex items-end justify-between">
        <div className="flex gap-2">
          <AspectSelect
            selectedAspect={aspect}
            onAspectChange={(aspect) => setValue("aspectRatio", aspect)}
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
