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
    <div className="columns-2 gap-5 px-10 sm:columns-3 xl:columns-4">
      {images.map((image) => (
        <Link
          key={image.id}
          href={`/editor/${image.id}`}
          className="mb-5 block break-inside-avoid"
        >
          <Image
            src={`/api/projects/${image.id}/image?variant=original`}
            alt=""
            width={image.width}
            height={image.height}
            unoptimized
            className="w-full rounded-xl shadow-xs"
          />
        </Link>
      ))}
    </div>
  )
}
