import { GeneratedImages } from "@/components/generated-images"
import { PromptInput } from "@/components/prompt-input"

export default async function Page() {
  return (
    <div className="space-y-6 pt-10">
      <PromptInput />
      <GeneratedImages />
    </div>
  )
}
