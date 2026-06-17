"use client"

import { Switch } from "@/components/ui/switch"

const settings = [
  {
    title: "Snap to grid",
    description:
      "Control how widgets align when moved. When on, widgets automatically align to grid. When off, widgets can be placed freely.",
    tip: "Tip: Hold ⌘ (Mac) or Ctrl (Windows) to move freely.",
  },
  {
    title: "Smart resizing",
    description:
      "Control how widgets align when resized. When on, neighbouring widgets automatically move to create a consistent layout. When off, neighbouring widgets stay in place.",
    tip: "Tip: Hold ⌘ (Mac) or Ctrl (Windows) to resize to grid.",
  },
]

export function PreferencesSettingsPage() {
  return (
    <>
      <h3 className="mb-5 text-lg font-bold">エディタ</h3>
      <div className="overflow-hidden rounded-xl border bg-card">
        {settings.map((setting) => (
          <div
            className="flex gap-6 border-b p-5 last:border-b-0"
            key={setting.title}
          >
            <div className="grow">
              <div className="mb-1 text-base">{setting.title}</div>
              <p className="max-w-170 text-sm text-muted-foreground">
                {setting.description}
              </p>
              <div className="mt-3 inline-flex rounded-md border bg-background px-2 py-1 text-xs">
                {setting.tip}
              </div>
            </div>
            <Switch aria-label={setting.title} defaultChecked />
          </div>
        ))}
      </div>
    </>
  )
}
