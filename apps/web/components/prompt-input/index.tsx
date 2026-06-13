"use client"

import { ImagePlusIcon, SparklesIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
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
import { Suggestion } from "./suggestion"

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
      prompt: "",
      aspectRatio: "auto",
    },
  })
  const prompt = useWatch({ control, name: "prompt" })
  const aspect = useWatch({ control, name: "aspectRatio" })
  const [isGenerating, setIsGenerating] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const canGenerate = !isGenerating && prompt.trim().length > 0

  async function handleGenerate(
    options: Omit<GenerateProjectInput, "referenceImages">
  ) {
    if (!user) {
      openAuthDialog()
      return
    }

    setIsGenerating(true)

    try {
      const referenceImages = await Promise.all(
        images.map(
          (image) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = () => reject(reader.error)
              reader.readAsDataURL(image)
            })
        )
      )
      const projectId = await generateProject({ ...options, referenceImages })
      router.push(`/editor/${projectId}`)
    } catch {
      alert("生成に失敗しました。")
      setIsGenerating(false)
    }
  }
  return (
    <div>
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
          className="min-h-14 resize-none rounded-none border-none px-1 pt-0 pb-2 shadow-none ring-0! outline-none leading-relaxed bg-transparent!"
          placeholder="作りたい資料画像を自然文で書いてください。"
        />
        <div className="flex items-end justify-between">
          <div className="flex gap-2">
            <input
              accept="image/*"
              className="hidden"
              multiple
              onChange={(event) => {
                setImages((current) => [
                  ...current,
                  ...Array.from(event.currentTarget.files ?? []),
                ])
                event.currentTarget.value = ""
              }}
              ref={imageInputRef}
              type="file"
            />
            <Button
              onClick={() => imageInputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              <ImagePlusIcon />
              画像を添付
            </Button>
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
        {images.length > 0 ? (
          <div className="-mx-3.5 -mb-3.5 mt-3 flex flex-wrap gap-2 rounded-b-[22px] border-t bg-muted/50 p-3.5">
            {images.map((image, index) => (
              <div
                className="flex max-w-52 items-center gap-2 rounded-md bg-background px-2.5 py-1.5 text-xs"
                key={`${image.name}-${image.lastModified}-${index}`}
              >
                <span className="truncate">{image.name}</span>
                <button
                  aria-label={`${image.name}を削除`}
                  className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setImages((current) =>
                      current.filter((_, imageIndex) => imageIndex !== index)
                    )
                  }
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </form>
      <Suggestion onSelect={(content) => setValue("prompt", content)} />
    </div>
  )
}
