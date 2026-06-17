import type { ReactNode } from "react"

function SettingSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  )
}

export { SettingSection }
