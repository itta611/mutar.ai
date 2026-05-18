import { ProjectSwitcher } from "@/components/project-switcher"
import { Inspector } from "@/components/inspector"
import { EditorNavigationButtons } from "./navigation-buttons"
import { EditorSync } from "./sync"

export default function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative h-full flex">
      <div className="grow relative">
        <EditorSync />
        {children}
        <EditorNavigationButtons />
        <ProjectSwitcher />
      </div>
      <Inspector />
    </div>
  )
}
