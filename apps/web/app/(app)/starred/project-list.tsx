import { listStarredImagesByUserId } from "@mutar/db/repo"
import { Gallery } from "@/components/gallary"
import { getServerSession } from "@/lib/session"

export async function ProjectList() {
  const session = await getServerSession()
  const images = session ? await listStarredImagesByUserId(session.user.id) : []

  return <Gallery initialImages={images} queryKey={["projects", "starred"]} />
}
