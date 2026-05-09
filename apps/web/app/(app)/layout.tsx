import type { Metadata } from "next"
import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Hengen",
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
      <div className="w-full h-dvh flex flex-col">
        <Navbar />
        <div className="grow bg-zinc-50 dark:bg-background">{children}</div>
      </div>
    </Providers>
  )
}
