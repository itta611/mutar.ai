import { ProjectSwitcher } from "@/components/project-switcher"

export default function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative h-full">
      {children}
      <ProjectSwitcher />
    </div>
  )
}
