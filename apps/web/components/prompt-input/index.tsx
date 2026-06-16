"use client"

import { SparklesIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
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
import { CountSelect } from "./count-select"
import { addImageFiles, FileUpload, type UploadedImage } from "./file-upload"
import { type PromptStyle, StyleSelect } from "./style-select"
import { Suggestion } from "./suggestion"
import { cn } from "@/lib/utils"

export function PromptInput() {
  const generateProject = useGenerateProject()
  const { openAuthDialog } = useAuthDialog()
  const router = useRouter()
  const session = authClient.useSession()
  const user = session.data?.user
  const { control, handleSubmit, register, setValue } = useForm<{
    aspectRatio: EditorAspectRatio
    count: GenerateProjectInput["count"]
    prompt: string
  }>({
    defaultValues: {
      prompt: "",
      aspectRatio: "auto",
      count: 2,
    },
  })
  const prompt = useWatch({ control, name: "prompt" })
  const aspect = useWatch({ control, name: "aspectRatio" })
  const count = useWatch({ control, name: "count" })
  const [style, setStyle] = useState<PromptStyle>({
    themeColor: "#191714",
    backgroundColor: "#ffffff",
    transparentBackground: false,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const canGenerate =
    !isGenerating &&
    images.every((image) => image.dataUrl) &&
    (prompt.trim().length > 0 || images.length > 0)

  async function handleGenerate(
    options: Omit<GenerateProjectInput, "referenceImages">
  ) {
    if (!user) {
      openAuthDialog()
      return
    }

    setIsGenerating(true)

    try {
      const referenceImages = images.map((image) => image.dataUrl!)
      const projectId = await generateProject({
        ...options,
        referenceImages,
        style,
      })
      router.push(`/editor/${projectId}`)
    } catch {
      toast.error("生成に失敗しました。")
      setIsGenerating(false)
    }
  }
  return (
    <>
      <form
        onSubmit={handleSubmit(handleGenerate)}
        className={cn(
          "rounded-[20px] border-2 shadow-lg/5 border-primary p-2.5 bg-background dark:bg-zinc-900 relative z-20"
        )}
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
          onPaste={(event) => {
            const files = Array.from(event.clipboardData.files).filter((file) =>
              file.type.startsWith("image/")
            )
            if (files.length === 0) return
            event.preventDefault()
            addImageFiles(files, images, setImages)
          }}
          className="min-h-14 resize-none rounded-none border-none px-2 pt-1 pb-2 shadow-none ring-0! outline-none leading-relaxed bg-transparent!"
          placeholder="作りたい資料画像を自然文で書いてください。"
        />
        <div className="flex items-end justify-between">
          <div className="flex gap-px">
            <FileUpload images={images} setImages={setImages} />
            <AspectSelect
              selectedAspect={aspect}
              onAspectChange={(aspect) => setValue("aspectRatio", aspect)}
            />
            <CountSelect
              selectedCount={count}
              onCountChange={(count) =>
                setValue("count", count as GenerateProjectInput["count"])
              }
            />
            <StyleSelect style={style} onStyleChange={setStyle} />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!canGenerate}
            className="border-0"
          >
            <SparklesIcon data-icon="inline-end" />
            {isGenerating ? "生成中" : "生成"}
          </Button>
        </div>
      </form>
      {images.length > 0 ? (
        <div className="mx-0.5 flex flex-wrap gap-2 rounded-b-2xl border-b border-l border-r bg-zinc-50 dark:bg-zinc-800 p-2 pt-6 relative -top-4 -mb-4 z-10">
          {images.map((image, index) => (
            <div
              className="flex max-w-52 items-center gap-2.5 rounded-lg bg-background p-1 pr-2.5 text-xs border"
              key={`${image.file.name}-${image.file.lastModified}-${index}`}
            >
              <div className="size-8 shrink-0 overflow-hidden rounded">
                {image.dataUrl ? (
                  <Image
                    alt=""
                    className="size-full object-cover border"
                    height={32}
                    src={image.dataUrl}
                    width={32}
                  />
                ) : null}
              </div>
              <span className="truncate">{image.file.name}</span>
              <button
                aria-label={`${image.file.name}を削除`}
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
      <Suggestion onSelect={(content) => setValue("prompt", content)} />
    </>
  )
}
