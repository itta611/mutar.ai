import { listGeneratedImagesByUserId } from "@/db/repo"
import { getServerSession } from "@/lib/session"
import { HomeContent } from "./content"

export default async function Page() {
  const session = await getServerSession()
  const images = session
    ? (await listGeneratedImagesByUserId(session.user.id)).map(({ id }) => id)
    : []

  return (
    <div className="pt-10 bg-zinc-50 min-h-full px-20 pb-10">
      <HomeContent initialImages={images} />
    </div>
  )
}
