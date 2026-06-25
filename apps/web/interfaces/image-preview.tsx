"use client"

import { XIcon } from "lucide-react"
import Image, { type ImageProps } from "next/image"

import { Button } from "@/components/ui/button"

type ImagePreviewProps = {
  alt?: string
  height: number
  onClose: () => void
  src: ImageProps["src"]
  width: number
}

export function ImagePreview({
  alt = "",
  height,
  onClose,
  src,
  width,
}: ImagePreviewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <Button
        aria-label="閉じる"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10 hover:text-white"
        onClick={onClose}
        type="button"
        size="icon"
        variant="ghost"
      >
        <XIcon />
      </Button>
      <div
        className="relative"
        style={{
          height,
          paddingBlock: height * 0.05,
          paddingInline: width * 0.05,
          width,
        }}
      >
        <div className="relative h-full w-full">
          <Image alt={alt} className="object-contain" fill src={src} />
        </div>
      </div>
    </div>
  )
}
