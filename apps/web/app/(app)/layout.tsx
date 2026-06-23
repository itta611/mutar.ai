import type { Metadata } from "next"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Mutar",
  description:
    "Slide and poster oriented AI image generation with editable text layers.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Providers>
      <AppSidebar />
      <SidebarTrigger className="fixed top-2 left-2 z-50 md:hidden" />
      <div className="flex h-dvh w-full min-w-0 flex-col">
        <div className="min-h-0 min-w-0 grow bg-background">{children}</div>
      </div>
    </Providers>
  )
}
