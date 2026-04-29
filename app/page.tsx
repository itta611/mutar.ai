import { GeneratedImages } from "@/components/generated-images"
import LogoIcon from "@/components/logo-icon"
import { PromptInput } from "@/components/prompt-input"

export default async function Page() {
  return (
    <div className="pt-10">
      <div className="mb-20">
        <div className="flex w-200 mx-auto mb-5 px-3 items-center gap-2.5">
          <LogoIcon width={32} />
          <div className="text-2xl font-bold">何を作りますか？</div>
        </div>
        <PromptInput />
      </div>
      <GeneratedImages />
    </div>
  )
}
