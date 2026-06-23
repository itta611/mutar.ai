"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
      <Tabs onValueChange={setTheme} value={theme}>
        <TabsList>
          {themes.map(({ icon: Icon, label, value }) => (
            <TabsTrigger aria-label={label} key={value} value={value}>
              <Icon />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  )
}
