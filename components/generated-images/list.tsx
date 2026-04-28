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
    <div className="grid gap-4 md:grid-cols-2">
      {images.map((image) => (
        <Link key={image.id} href={`/editor/${image.id}`}>
          <Image
            src={`/api/projects/${image.id}/image?variant=original`}
            alt=""
            width={image.width}
            height={image.height}
            unoptimized
            className="w-full rounded-lg border"
          />
        </Link>
      ))}
    </div>
  )
}
