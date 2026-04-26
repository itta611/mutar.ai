"use client"
import { authClient } from "@/lib/auth-client"
import { useAuthDialog } from "@/hooks/use-auth-dialog"
import { Button } from "./ui/button"

export function Navbar() {
  const { openAuthDialog } = useAuthDialog()
  const session = authClient.useSession()
  const user = session.data?.user

  return (
    <nav className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {user ? (
          user.email
        ) : (
          <Button variant="outline" onClick={openAuthDialog}>
            ログイン
          </Button>
        )}
      </div>
    </nav>
  )
}
