import type { ReactNode } from "react"

function SettingSection({
  title,
  description,
  horizontal = false,
  children,
}: {
  title: string
  description?: string
  horizontal?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className={
        horizontal ? "flex items-center justify-between space-x-3" : "space-y-3"
      }
    >
      <div className="space-y-2">
        <h3 className="font-bold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

export { SettingSection }
