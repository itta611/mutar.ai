"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

export type GeneratedImage = {
  id: string
  width: number
  height: number
}

function getRows(images: GeneratedImage[], containerWidth: number) {
  if (containerWidth === 0) {
    return []
  }

  const gap = 12
  const targetHeight = 240
  const looseRowHeight = 200
  const rows: { height: number; images: GeneratedImage[] }[] = []
  let row: GeneratedImage[] = []
  let aspectSum = 0

  for (const image of images) {
    row.push(image)
    aspectSum += image.width / image.height

    if (aspectSum * targetHeight + gap * (row.length - 1) >= containerWidth) {
      rows.push({
        images: row,
        height: (containerWidth - gap * (row.length - 1)) / aspectSum,
      })
      row = []
      aspectSum = 0
    }
  }

  if (row.length > 0) {
    rows.push({ images: row, height: looseRowHeight })
  }

  return rows
}

export function GeneratedImagesList({
  images: initialImages,
}: {
  images: GeneratedImage[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState(initialImages)
  const [containerWidth, setContainerWidth] = useState(0)
  const rows = useMemo(
    () => getRows(images, containerWidth),
    [containerWidth, images]
  )

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

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })

    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="space-y-3">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {row.images.map((image) => (
            <Link
              key={image.id}
              href={`/editor/${image.id}`}
              className="block shrink-0"
              style={{
                width: row.height * (image.width / image.height),
                height: row.height,
              }}
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
      ))}
    </div>
  )
}
