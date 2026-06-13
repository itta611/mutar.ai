import { Suspense } from "react"
import { GallerySkeleton } from "@/components/gallary"
import { ProjectList } from "./project-list"

export default async function Page() {
  return (
    <div className="min-h-full px-10 pb-10">
      <h1 className="py-10 text-xl font-bold">ゴミ箱</h1>
      <Suspense fallback={<GallerySkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  )
}
