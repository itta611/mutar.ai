"use client"

import { Button } from "@/components/ui/button"
import { useAuthDialog } from "@/hooks/use-auth-dialog"

export default function Page() {
  const { openAuthDialog } = useAuthDialog()
  return (
    <div>
      <Button onClick={openAuthDialog}>Login</Button>
    </div>
  )
}
