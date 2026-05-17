"use client"

import { cn } from "@/lib/utils"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

const themes = [
  { label: "ダーク", value: "dark", icon: Moon },
  { label: "ライト", value: "light", icon: Sun },
  { label: "システム", value: "system", icon: Monitor },
]

export function ThemeSelect() {
  const { setTheme, theme } = useTheme()

  return (
    <>
      <span>テーマ</span>
      <div className="flex rounded-md bg-muted p-0.5">
        {themes.map(({ icon: Icon, label, value }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground",
              theme === value && "bg-background text-foreground"
            )}
          >
            <Icon />
          </button>
        ))}
      </div>
    </>
  )
}
