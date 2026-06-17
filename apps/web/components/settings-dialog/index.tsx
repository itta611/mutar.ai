"use client"

import { useState } from "react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { AccountSettingsPage } from "./account"
import { PreferencesSettingsPage } from "./preferences"

const navItems = [
  { group: "Account", items: ["Preferences", "Account"] },
  { group: "Workspace", items: ["General", "Members", "Mentions", "Billing"] },
]

type SettingsTab = "Preferences" | "Account"

export function SettingsDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Preferences")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[min(760px,calc(100dvh-4rem))] max-w-250! grid-cols-1 gap-0 overflow-hidden p-0 sm:grid-cols-[240px_1fr]">
        <DialogTitle className="sr-only">設定</DialogTitle>
        <aside className="border-b bg-muted/40 p-4 sm:border-r sm:border-b-0">
          {navItems.map((group) => (
            <div className="mb-5" key={group.group}>
              <div className="mb-2 px-2 text-sm font-medium text-muted-foreground">
                {group.group}
              </div>
              <div className="grid gap-1">
                {group.items.map((item) => (
                  <button
                    type="button"
                    onClick={() => {
                      if (item === "Preferences" || item === "Account") {
                        setActiveTab(item)
                      }
                    }}
                    className={cn(
                      "h-9 rounded-md px-2 text-left text-sm",
                      item === activeTab && "bg-accent text-accent-foreground"
                    )}
                    key={item}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>
        <div className="overflow-y-auto p-6 sm:p-10">
          {activeTab === "Preferences" ? (
            <PreferencesSettingsPage open={open} />
          ) : (
            <AccountSettingsPage />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
