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
    <div className="flex flex-col h-full">
      <Navbar />
      <div className="relative h-full flex">
        <div className="grow relative dark:bg-background bg-zinc-50">
          {children}
          <EditorNavigationButtons />
          <ProjectSwitcher />
        </div>
        <Inspector />
      </div>
    </div>
  )
}
