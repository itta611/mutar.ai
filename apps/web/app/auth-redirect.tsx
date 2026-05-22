"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { authClient } from "@/lib/auth-client"

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const session = authClient.useSession()
  const user = session.data?.user

  useEffect(() => {
    if (session.isPending) {
      return
    }

    if (user && pathname === "/") {
      router.replace("/home")
      return
    }

    if (!user && pathname !== "/") {
      router.replace("/")
    }
  }, [pathname, router, session.isPending, user])

  return children
}
