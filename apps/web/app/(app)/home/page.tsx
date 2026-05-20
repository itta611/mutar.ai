import { listGeneratedImagesByUserId } from "@hengen/db/repo"
import { getServerSession } from "@/lib/session"
import { GeneratedImages } from "@/components/gallary"
import LogoIcon from "@/components/logo-icon"
import { PromptInput } from "@/components/prompt-input"

export default async function Page() {
  const session = await getServerSession()
  const images = session
    ? await listGeneratedImagesByUserId(session.user.id)
    : []

  return (
    <div className="pb-10 min-h-full px-10">
      <div className="pt-18 pb-24 md:px-5 max-w-200 mx-auto">
        <div className="flex mx-auto mb-5 px-1.5 items-center gap-3">
          <LogoIcon width={30} />
          <div className="text-balance text-xl">何を作りますか？</div>
        </div>
        <PromptInput />
      </div>
      <GeneratedImages initialImages={images} />
    </div>
  )
}
