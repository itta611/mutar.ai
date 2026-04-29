"use client"

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
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
      {images.map((image) => (
        <Link
          key={image.id}
          href={`/editor/${image.id}`}
          className="block aspect-[4/3] overflow-hidden rounded-xl shadow-xs"
        >
          <Image
            src={`/api/projects/${image.id}/image?variant=original`}
            alt=""
            width={image.width}
            height={image.height}
            unoptimized
            className="size-full object-cover"
          />
        </Link>
      ))}
    </div>
  )
}
