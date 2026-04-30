import type { Metadata } from "next"
import { Provider } from "jotai"
import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"

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
    <Provider>
      <AppSidebar />
      <div className="overflow-visible h-dvh w-full overflow-y-auto flex flex-col">
        <Navbar />
        <div className="z-50 grow rounded-tl-md outline outline-border/70">
          {children}
        </div>
      </div>
    </Provider>
  )
}
