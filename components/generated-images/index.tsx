import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { projects } from "@/db/schema"
import { getServerSession } from "@/lib/session"
import { GeneratedImagesList } from "./list"

export async function GeneratedImages() {
  const session = await getServerSession()
  const images = session
    ? await db
        .select({
          id: projects.id,
          width: projects.width,
          height: projects.height,
        })
        .from(projects)
        .where(eq(projects.userId, session.user.id))
        .orderBy(desc(projects.createdAt))
    : []

  return <GeneratedImagesList images={images} />
}
