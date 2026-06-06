"use client"

import LogoIcon from "@/components/logo-icon"
import { Button } from "@/components/ui/button"
import { useAuthDialog } from "@/hooks/use-auth-dialog"

export default function Page() {
  const { openAuthDialog } = useAuthDialog()
  return (
    <div className="flex flex-col space-y-8 min-h-dvh w-full items-center justify-center">
      <LogoIcon className="saturate-0 opacity-30 size-12" />
      <Button onClick={openAuthDialog}>Hengenにログイン</Button>
    </div>
  )
}
