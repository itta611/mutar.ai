import type { Metadata } from "next"
import {
  Cormorant_Garamond,
  IBM_Plex_Sans,
  Manrope,
  Source_Serif_4,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { AuthDialog } from "@/components/auth-dialog"
import { AuthDialogProvider } from "@/hooks/use-auth-dialog"
import { PricingDialogProvider } from "@/components/pricing-dialog"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AuthRedirect } from "./auth-redirect"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-editor-plex",
  weight: ["400", "500", "600"],
})

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-editor-serif",
})

export const metadata: Metadata = {
  title: "Mutar",
  description:
    "Slide and poster oriented AI image generation with editable text layers.",
}

const editorSans = Manrope({
  subsets: ["latin"],
  variable: "--font-editor-sans",
})

const editorDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-editor-display",
  weight: ["400", "500", "600", "700"],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={cn(
        manrope.variable,
        cormorant.variable,
        editorSans.variable,
        editorDisplay.variable,
        ibmPlexSans.variable,
        sourceSerif.variable,
        "antialiased"
      )}
    >
      <body>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "18.75rem",
              "--sidebar-width-mobile": "18.75rem",
            } as React.CSSProperties
          }
        >
          <AuthDialogProvider>
            <PricingDialogProvider>
              <ThemeProvider>
                <AuthRedirect>{children}</AuthRedirect>
                <AuthDialog />
                <Toaster position="bottom-center" />
              </ThemeProvider>
            </PricingDialogProvider>
          </AuthDialogProvider>
        </SidebarProvider>
      </body>
    </html>
  )
}
