import { Suspense } from "react"
import { GallerySkeleton } from "@/components/gallary"
import LogoIcon from "@/components/logo-icon"
import { PromptInput } from "@/components/prompt-input"
import { ProjectList } from "./project-list"

export default async function Page() {
  return (
    <div className="pb-10 min-h-full px-10">
      <div className="pt-36 pb-24 md:px-5 max-w-200 mx-auto">
        <div className="flex mx-auto mb-6 px-1.5 items-center gap-3">
          <LogoIcon width={30} />
          <div className="text-balance text-xl">何を作りますか？</div>
        </div>
        <PromptInput />
      </div>
      <h1 className="py-10 text-2xl font-bold pl-1">最近</h1>
      <Suspense fallback={<GallerySkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  )
}
