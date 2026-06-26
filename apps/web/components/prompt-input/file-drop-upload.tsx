"use client"

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react"
import {
  addImageFiles,
  type UploadedImage,
} from "@/components/prompt-input/file-upload"
import { FileIcon } from "lucide-react"

type FileDropUploadProps = {
  images: UploadedImage[]
  setImages: Dispatch<SetStateAction<UploadedImage[]>>
}

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files")
}

function isLeavingWindow(event: DragEvent) {
  return (
    event.clientX <= 0 ||
    event.clientY <= 0 ||
    event.clientX >= window.innerWidth ||
    event.clientY >= window.innerHeight
  )
}

export function FileDropUpload({ images, setImages }: FileDropUploadProps) {
  const [isFileDragActive, setIsFileDragActive] = useState(false)
  const [, startTransition] = useTransition()

  const addFiles = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"))
      if (imageFiles.length === 0) return

      addImageFiles(imageFiles, images, setImages)
    },
    [images, setImages]
  )

  useEffect(() => {
    function handleDragEnter(event: DragEvent) {
      if (!hasFiles(event)) return

      event.preventDefault()
      setIsFileDragActive(true)
    }

    function handleDragOver(event: DragEvent) {
      if (!hasFiles(event)) return

      event.preventDefault()
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy"
      }
    }

    function handleDragLeave(event: DragEvent) {
      if (!hasFiles(event) || !isLeavingWindow(event)) return

      setIsFileDragActive(false)
    }

    function handleDrop(event: DragEvent) {
      if (!hasFiles(event)) return

      event.preventDefault()
      const files = Array.from(event.dataTransfer?.files ?? [])
      setIsFileDragActive(false)
      startTransition(() => addFiles(files))
    }

    window.addEventListener("dragenter", handleDragEnter)
    window.addEventListener("dragover", handleDragOver)
    window.addEventListener("dragleave", handleDragLeave)
    window.addEventListener("drop", handleDrop)

    return () => {
      window.removeEventListener("dragenter", handleDragEnter)
      window.removeEventListener("dragover", handleDragOver)
      window.removeEventListener("dragleave", handleDragLeave)
      window.removeEventListener("drop", handleDrop)
    }
  }, [addFiles, startTransition])

  if (!isFileDragActive) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] p-10 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-zinc-950/70">
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-zinc-300 px-6 text-center">
        <div className="relative mb-6 flex size-24 items-center justify-center">
          <div className="relative flex size-20 items-center justify-center rounded-lg border-zinc-200 bg-muted">
            <FileIcon className="size-9 text-zinc-950 dark:text-white" />
          </div>
        </div>
        <div className="text-2xl font-semibold tracking-normal text-zinc-950 dark:text-white">
          ファイルをアップロード
        </div>
        <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          ここにファイルをドラッグ&ドロップしてください。
        </div>
      </div>
    </div>
  )
}
