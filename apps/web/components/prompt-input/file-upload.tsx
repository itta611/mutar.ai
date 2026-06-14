import { PaperclipIcon } from "lucide-react"
import { useRef, type Dispatch, type SetStateAction } from "react"
import { Button } from "@/components/ui/button"

export type UploadedImage = {
  dataUrl?: string
  file: File
}

export function FileUpload({
  images,
  setImages,
}: {
  images: UploadedImage[]
  setImages: Dispatch<SetStateAction<UploadedImage[]>>
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const fileKeys = new Set(
            images.map(
              ({ file }) => `${file.name}-${file.size}-${file.lastModified}`
            )
          )
          const uploadedImages = Array.from(event.currentTarget.files ?? [])
            .filter((file) => {
              const key = `${file.name}-${file.size}-${file.lastModified}`
              if (fileKeys.has(key)) return false
              fileKeys.add(key)
              return true
            })
            .map((file) => ({ file }))

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
        ref={inputRef}
        type="file"
      />
      <Button
        onClick={() => inputRef.current?.click()}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <PaperclipIcon />
      </Button>
    </>
  )
}
