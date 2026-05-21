import { listDeletedImagesByUserId } from "@hengen/db/repo"
import { GeneratedImages } from "@/components/gallary"
import { getServerSession } from "@/lib/session"

export default async function Page() {
  const session = await getServerSession()
  const images = session ? await listDeletedImagesByUserId(session.user.id) : []

  return (
    <div className="min-h-full px-10 pb-10">
      <h1 className="py-10 text-xl font-bold">ゴミ箱</h1>
      <GeneratedImages initialImages={images} trashOnly />
    </div>
  )
}
