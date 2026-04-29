"use client"

import { EllipsisIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

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

  return (
    <div className="grid grid-cols-2 gap-x-7 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
      {images.map((image) => (
        <Link
          key={image.id}
          href={`/editor/${image.id}`}
          className="block overflow-hidden rounded-xl bg-accent"
        >
          <Image
            src={`/api/projects/${image.id}/image?variant=original`}
            alt=""
            width={image.width}
            height={image.height}
            unoptimized
            className="w-full object-cover aspect-[16/9]"
          />
          <div className="px-3 py-2.5 flex justify-between items-center">
            <span>タイトル</span>
            <EllipsisIcon className="size-4.5 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  )
}
