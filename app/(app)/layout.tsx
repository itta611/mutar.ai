import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"
import type { Metadata } from "next"

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
    <>
      <AppSidebar />
      <div className="h-dvh w-full overflow-y-auto flex flex-col">
        <Navbar />
        <div className="grow rounded-tl-md border border-border/70 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  )
}
