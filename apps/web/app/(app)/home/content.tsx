"use client"

import {
  type GeneratedImage,
  GeneratedImages,
} from "@/components/generated-images"
import LogoIcon from "@/components/logo-icon"
import { PromptInput } from "@/components/prompt-input"

export function HomeContent({
  initialImages,
}: {
  initialImages: GeneratedImage[]
}) {
  return (
    <>
      <div className="mb-20 md:px-5 max-w-200 mx-auto">
        <div className="flex mx-auto mb-5 px-1.5 items-center gap-3">
          <LogoIcon width={30} />
          <div className="text-balance text-xl">何を作りますか？</div>
        </div>
        <PromptInput />
      </div>
      <GeneratedImages initialImages={initialImages} />
    </>
  )
}
