import { Suspense } from "react"
import { GallerySkeleton } from "@/components/gallary"
import { ProjectList } from "./project-list"

export default async function Page() {
  return (
    <div className="min-h-full px-10 pb-10">
      <h1 className="py-10 text-2xl font-bold pl-1">ゴミ箱</h1>
      <Suspense fallback={<GallerySkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  )
}
