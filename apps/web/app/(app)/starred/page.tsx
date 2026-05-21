import { listStarredImagesByUserId } from "@hengen/db/repo"
import { GeneratedImages } from "@/components/gallary"
import { getServerSession } from "@/lib/session"

export default async function Page() {
  const session = await getServerSession()
  const images = session ? await listStarredImagesByUserId(session.user.id) : []

  return (
    <div className="min-h-full px-10 pb-10">
      <h1 className="py-10 text-xl font-bold">お気に入り</h1>
      <GeneratedImages initialImages={images} starredOnly />
    </div>
  )
}
