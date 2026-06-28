"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppSidebarTrigger() {
  const pathname = usePathname()
  const isEditor = pathname === "/editor" || pathname.startsWith("/editor/")

  if (isEditor) {
    return null
  }

  return <SidebarTrigger className="fixed top-2 left-2 z-50 md:hidden" />
}
