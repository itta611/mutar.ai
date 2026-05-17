import { ProjectSwitcher } from "@/components/project-switcher"
import { EditorSync } from "./sync"

export default function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative h-full">
      <EditorSync />
      {children}
      <ProjectSwitcher />
    </div>
  )
}
