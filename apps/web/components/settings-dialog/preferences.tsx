"use client"

import { useQuery } from "@tanstack/react-query"

import { Switch } from "@/components/ui/switch"
import { apiClient } from "@/lib/api-client"

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

async function getCreditUsage() {
  const response = await apiClient.credits.$get()

  if (!response.ok) {
    throw new Error("request_failed")
  }

  return response.json()
}

export function PreferencesSettingsPage({ open }: { open: boolean }) {
  const { data: creditUsage } = useQuery({
    queryKey: ["credit-usage"],
    queryFn: getCreditUsage,
    enabled: open,
  })
  const remainingCredits = creditUsage
    ? Math.max(0, creditUsage.quota - creditUsage.used)
    : 0
  const creditPercent = creditUsage
    ? Math.min(100, (remainingCredits / creditUsage.quota) * 100)
    : 0

  return (
    <>
      <h2 className="mb-10 text-3xl font-medium">Preferences</h2>
      <h3 className="mb-5 text-2xl font-medium">Canvas</h3>
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
      <h3 className="mt-10 mb-5 text-2xl font-medium">Credits</h3>
      <div className="mb-5 rounded-xl border bg-card p-5">
        <div className="mb-2 text-base">残りクレジット</div>
        <div className="text-sm text-muted-foreground">
          基準日: 毎月{creditUsage?.resetDay ?? "-"}日
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-2 grow rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground"
              style={{ width: `${creditPercent}%` }}
            />
          </div>
          <div className="w-20 text-right text-sm text-muted-foreground">
            {creditUsage ? `${remainingCredits}/${creditUsage.quota}` : "-"}
          </div>
        </div>
      </div>
    </>
  )
}
