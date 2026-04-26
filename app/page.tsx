import { HomeShell } from "@/components/home-shell"
import { getServerSession } from "@/lib/session"

export default async function Page() {
  const session = await getServerSession()

  return (
    <HomeShell
      initialUser={
        session
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }
          : null
      }
    />
  )
}
