"use client"

import { SparklesIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import type { EditorAspectRatio } from "@/atom/generate"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthDialog } from "@/hooks/use-auth-dialog"
import {
  type GenerateProjectInput,
  useGenerateProject,
} from "@/hooks/use-generate-project"
import { authClient } from "@/lib/auth-client"
import { AspectSelect } from "./aspect-select"

const defaultPrompt =
  "企業の請求書処理を説明する業務フロー図の入った１枚のスライドを作成。「受領」「OCR読み取り」「承認」「支払い」「保存」の5ステップを左から右に配置。各ステップにアイコンを付け、スタイリッシュなデザイン。"

export function PromptInput() {
  const generateProject = useGenerateProject()
  const { openAuthDialog } = useAuthDialog()
  const router = useRouter()
  const session = authClient.useSession()
  const user = session.data?.user
  const { control, handleSubmit, register, setValue } = useForm<{
    aspectRatio: EditorAspectRatio
    prompt: string
  }>({
    defaultValues: {
      prompt: defaultPrompt,
      aspectRatio: "auto",
    },
  })
  const prompt = useWatch({ control, name: "prompt" })
  const aspect = useWatch({ control, name: "aspectRatio" })
  const [isGenerating, setIsGenerating] = useState(false)
  const canGenerate = !isGenerating && prompt.trim().length > 0

  async function handleGenerate(options: GenerateProjectInput) {
    if (!user) {
      openAuthDialog()
      return
    }

    setIsGenerating(true)

    try {
      const projectId = await generateProject(options)
      router.push(`/editor/${projectId}`)
    } catch {
      alert("生成に失敗しました。")
      setIsGenerating(false)
    }
  }
  return (
    <form
      onSubmit={handleSubmit(handleGenerate)}
      className="rounded-3xl border-2 border-primary p-3.5 shadow-lg/6 bg-background dark:bg-secondary"
    >
      <Textarea
        id="generation-prompt"
        {...register("prompt")}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            if (canGenerate) {
              event.currentTarget.form?.requestSubmit()
            }
          }
        }}
        defaultValue={defaultPrompt}
        className="min-h-10 resize-none rounded-none border-none px-1 pt-0 pb-2 shadow-none ring-0! outline-none leading-relaxed bg-transparent!"
        placeholder="作りたい資料画像を自然文で書いてください。"
      />
      <div className="flex items-end justify-between">
        <div className="flex gap-2">
          <AspectSelect
            selectedAspect={aspect}
            onAspectChange={(aspect) => setValue("aspectRatio", aspect)}
          />
        </div>
        <Button type="submit" size="lg" disabled={!canGenerate}>
          <SparklesIcon data-icon="inline-end" />
          {isGenerating ? "生成中" : "生成"}
        </Button>
      </div>
    </form>
  )
}
