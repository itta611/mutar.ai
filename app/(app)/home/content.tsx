"use client"

import { Provider } from "jotai"
import { useHydrateAtoms } from "jotai/utils"
import { GeneratedImages } from "@/components/generated-images"
import { generatedImageIdsAtom } from "@/components/generated-images/atoms"
import LogoIcon from "@/components/logo-icon"
import { PromptInput } from "@/components/prompt-input"

export function HomeContent({ initialImages }: { initialImages: string[] }) {
  return (
    <Provider>
      <Home initialImages={initialImages} />
    </Provider>
  )
}

function Home({ initialImages }: { initialImages: string[] }) {
  useHydrateAtoms([[generatedImageIdsAtom, initialImages]])

  return (
    <>
      <div className="mb-20">
        <div className="flex w-200 mx-auto mb-5 px-3 items-center gap-3">
          <LogoIcon width={30} />
          <div className="text-xl">何を作りますか？</div>
        </div>
        <PromptInput />
      </div>
      <GeneratedImages />
    </>
  )
}
