"use client"

import { PaperclipIcon, SparklesIcon, XIcon } from "lucide-react"
import Image from "next/image"
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
import { CountSelect } from "./count-select"
import { Suggestion } from "./suggestion"

type UploadedImage = {
  dataUrl?: string
  file: File
}

export function PromptInput() {
  const generateProject = useGenerateProject()
  const { openAuthDialog } = useAuthDialog()
  const router = useRouter()
  const session = authClient.useSession()
  const user = session.data?.user
  const { control, handleSubmit, register, setValue } = useForm<{
    aspectRatio: EditorAspectRatio
    count: number
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const canGenerate =
    !isGenerating &&
    prompt.trim().length > 0 &&
    images.every((image) => image.dataUrl)

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
        className="rounded-[20px] border-2 border-primary p-2.5 shadow-lg/6 bg-background dark:bg-secondary"
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
          className="min-h-14 resize-none rounded-none border-none px-2 pt-1 pb-2 shadow-none ring-0! outline-none leading-relaxed bg-transparent!"
          placeholder="作りたい資料画像を自然文で書いてください。"
        />
        <div className="flex items-end justify-between">
          <div className="flex gap-2">
            <input
              accept="image/*"
              className="hidden"
              multiple
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? [])
                const uploadedImages = files.map((file) => ({ file }))
                setImages((current) => [...current, ...uploadedImages])
                uploadedImages.forEach((image) => {
                  const reader = new FileReader()
                  reader.onload = () =>
                    setImages((current) =>
                      current.map((currentImage) =>
                        currentImage === image
                          ? { ...image, dataUrl: reader.result as string }
                          : currentImage
                      )
                    )
                  reader.readAsDataURL(image.file)
                })
                event.currentTarget.value = ""
              }}
              ref={imageInputRef}
              type="file"
            />
            <Button
              onClick={() => imageInputRef.current?.click()}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <PaperclipIcon />
            </Button>
            <AspectSelect
              selectedAspect={aspect}
              onAspectChange={(aspect) => setValue("aspectRatio", aspect)}
            />
            <CountSelect
              selectedCount={count}
              onCountChange={(count) => setValue("count", count)}
            />
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
        <div className="mx-4.5 flex flex-wrap gap-2 rounded-b-2xl border-b border-l border-r bg-zinc-50 p-2">
          {images.map((image, index) => (
            <div
              className="flex max-w-52 items-center gap-2.5 rounded-md bg-background p-1 pr-2.5 text-xs border"
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
    </div>
  )
}
