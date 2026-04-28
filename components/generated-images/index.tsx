import { listGeneratedImagesByUserId } from "@/db/repo"
import { getServerSession } from "@/lib/session"
import { GeneratedImagesList } from "./list"

export async function GeneratedImages() {
  const session = await getServerSession()
  const images = session
    ? await listGeneratedImagesByUserId(session.user.id)
    : []

  return <GeneratedImagesList images={images} />
}
