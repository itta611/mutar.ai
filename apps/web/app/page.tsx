"use client"

import { Button } from "@/components/ui/button"
import { useAuthDialog } from "@/hooks/use-auth-dialog"

export default function Page() {
  const { openAuthDialog } = useAuthDialog()
  return (
    <div className="flex min-h-dvh w-full items-center justify-center">
      <Button onClick={openAuthDialog}>Login</Button>
    </div>
  )
}
