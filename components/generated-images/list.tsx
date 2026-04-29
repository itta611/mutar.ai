"use client"

import { EllipsisIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button"

export type GeneratedImage = {
  id: string
  width: number
  height: number
}

export function GeneratedImagesList({
  images: initialImages,
}: {
  images: GeneratedImage[]
}) {
  const [images, setImages] = useState(initialImages)

  useEffect(() => {
    function handleCreated(event: Event) {
      const image = (event as CustomEvent<GeneratedImage>).detail
      setImages((currentImages) => [image, ...currentImages])
    }

    window.addEventListener("generated-image-created", handleCreated)

    return () => {
      window.removeEventListener("generated-image-created", handleCreated)
    }
  }, [])

  function deleteImage(id: string) {
    setImages((currentImages) =>
      currentImages.filter((image) => image.id !== id)
    )
    fetch(`/api/projects/${id}`, { method: "DELETE" })
  }

  return (
    <div className="grid grid-cols-2 gap-x-7 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
      {images.map((image) => (
        <div key={image.id} className="active:scale-99 transition duration-75">
          <Link href={`/editor/${image.id}`} className="block">
            <Image
              src={`/api/projects/${image.id}/image?variant=original`}
              alt=""
              width={image.width}
              height={image.height}
              unoptimized
              className="aspect-[16/9] w-full object-cover border rounded-t-xl"
            />
            <div className="flex items-center justify-between px-4 py-2.5 rounded-b-xl bg-accent">
              <span className="text-sm">タイトル</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      type="button"
                      className="text-muted-foreground"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                    >
                      <EllipsisIcon className="size-4.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => deleteImage(image.id)}
                  >
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
