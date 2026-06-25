"use client"

import { SparklesIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { usePromptForm } from "@/hooks/use-prompt-form"
import { ImagePreview } from "@/interfaces/image-preview"
import { AspectSelect } from "./aspect-select"
import { CountSelect } from "./count-select"
import { addImageFiles, FileUpload } from "./file-upload"
import { StyleSelect } from "./style-select"
import { Suggestion } from "./suggestion"
import { cn } from "@/lib/utils"

export function PromptInput() {
  const [previewImage, setPreviewImage] = useState<{
    height: number
    src: string
    width: number
  } | null>(null)
  const {
    aspect,
    canGenerate,
    count,
    form,
    handleGenerate,
    images,
    isGenerating,
    setAspect,
    setCount,
    setImages,
    setPrompt,
    setStyle,
    style,
  } = usePromptForm()
  const { handleSubmit, register } = form

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
              onAspectChange={setAspect}
            />
            <CountSelect
              selectedCount={count}
              onCountChange={setCount}
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
              className="flex max-w-52 items-center gap-2.5 rounded-lg bg-background dark:bg-white/5 p-1 pr-2.5 text-xs border"
              key={`${image.file.name}-${image.file.lastModified}-${index}`}
            >
              <button
                className="size-8 shrink-0 cursor-pointer overflow-hidden rounded border-0 bg-transparent p-0 disabled:cursor-default"
                disabled={!image.dataUrl}
                onClick={() =>
                  image.dataUrl &&
                  setPreviewImage({
                    height: window.innerHeight,
                    src: image.dataUrl,
                    width: window.innerWidth,
                  })
                }
                type="button"
              >
                {image.dataUrl ? (
                  <Image
                    alt=""
                    className="size-full object-cover border"
                    height={32}
                    src={image.dataUrl}
                    width={32}
                  />
                ) : null}
              </button>
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
      {previewImage ? (
        <ImagePreview
          height={previewImage.height}
          onClose={() => setPreviewImage(null)}
          src={previewImage.src}
          width={previewImage.width}
        />
      ) : null}
      <Suggestion onSelect={setPrompt} />
    </>
  )
}
