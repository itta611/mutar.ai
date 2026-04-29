import { GeneratedImages } from "@/components/generated-images"
import LogoIcon from "@/components/logo-icon"
import { PromptInput } from "@/components/prompt-input"

export default async function Page() {
  return (
    <div className="pt-10 bg-zinc-50 h-full px-20 pb-10">
      <div className="mb-20">
        <div className="flex w-200 mx-auto mb-5 px-3 items-center gap-3">
          <LogoIcon width={32} />
          <div className="text-xl">何を作りますか？</div>
        </div>
        <PromptInput />
      </div>
      <GeneratedImages />
    </div>
  )
}
