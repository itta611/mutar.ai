"use client"

import { useState } from "react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { AccountSettingsPage } from "./account"
import { GeneralSettingsPage } from "./general"
import { Settings2Icon, User2Icon } from "lucide-react"

const navItems = [
  { title: "アカウント", component: <AccountSettingsPage />, Icon: User2Icon },
  {
    title: "一般",
    component: <GeneralSettingsPage />,
    Icon: Settings2Icon,
  },
]

export function SettingsDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[min(760px,calc(100dvh-4rem))] max-w-250! grid-cols-1 gap-0 overflow-hidden p-0 sm:grid-cols-[240px_1fr]">
        <DialogTitle className="sr-only">設定</DialogTitle>
        <aside className="border-b bg-muted/40 p-3 sm:border-r sm:border-b-0">
          <div className="grid gap-1">
            {navItems.map((item, index) => (
              <button
                type="button"
                onClick={() => {
                  setActiveTab(index)
                }}
                className={cn(
                  "h-9 rounded-md px-3 text-left text-sm cursor-pointer hover:bg-accent inline-flex items-center",
                  activeTab === index && "bg-accent text-accent-foreground"
                )}
                key={item.title}
              >
                {<item.Icon className="size-4 mr-2 inline" />}
                {item.title}
              </button>
            ))}
          </div>
        </aside>
        <div className="overflow-y-auto p-6 sm:p-10 scrollbar-thin hover:scrollbar-thumb-border scrollbar-thumb-transparent">
          <h2 className="mb-10 text-2xl font-bold">
            {navItems[activeTab].title}
          </h2>

          {navItems[activeTab].component}
        </div>
      </DialogContent>
    </Dialog>
  )
}
