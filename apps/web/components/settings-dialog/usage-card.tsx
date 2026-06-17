"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

async function getCreditUsage() {
  const response = await apiClient.credits.$get()

  if (!response.ok) {
    throw new Error("request_failed")
  }

  return response.json()
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function formatNextResetDate(periodStart: string, resetDay: number) {
  const date = new Date(periodStart)
  const nextMonth = date.getUTCMonth() + 1
  const year = date.getUTCFullYear() + Math.floor(nextMonth / 12)
  const month = nextMonth % 12
  const day = Math.min(resetDay, daysInMonth(year, month))

  return `${month + 1}月${day}日`
}

function UsageCard() {
  const { data: creditUsage } = useQuery({
    queryKey: ["credit-usage"],
    queryFn: getCreditUsage,
  })
  const creditPercent = creditUsage
    ? Math.min(100, (creditUsage.used / creditUsage.quota) * 100)
    : 0
  const nextResetDate = creditUsage
    ? formatNextResetDate(creditUsage.periodStart, creditUsage.resetDay)
    : "-"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-medium">
        今月の使用量
        <span>
          {creditUsage ? `${creditUsage.used} / ${creditUsage.quota}` : "-"}
        </span>
      </div>
      <div className="flex items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="h-2 grow rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${creditPercent}%` }}
          />
        </div>
        <span>残り{(100 - creditPercent).toFixed(0)}%</span>
      </div>
      <span className="text-muted-foreground">
        次回リセット: {nextResetDate}
      </span>
    </div>
  )
}

export { UsageCard }
