import { ProjectSwitcher } from "@/components/project-switcher"
import { Inspector } from "@/components/inspector"
import { EditorNavigationButtons } from "./navigation-buttons"
import { Navbar } from "@/components/navbar"

export default function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <Navbar />
      <div className="relative flex h-full min-h-0 min-w-0">
        <div className="relative min-h-0 min-w-0 grow bg-zinc-50 dark:bg-background">
          {children}
          <EditorNavigationButtons />
          <ProjectSwitcher />
        </div>
        <Inspector />
      </div>
    </div>
  )
}
