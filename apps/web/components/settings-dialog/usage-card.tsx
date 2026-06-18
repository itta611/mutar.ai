"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"

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
    <div className="border rounded-2xl px-5 space-y-4.5 py-4">
      <div className="text-sm h-8">今月の使用量</div>
      <div className="flex items-center justify-between gap-5 text-sm">
        <div className="w-12">
          {creditUsage ? `${creditUsage.used} / ${creditUsage.quota}` : "- / -"}
        </div>
        <Progress className="grow" value={creditPercent} />
        <span className="text-muted-foreground">
          {creditPercent.toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">
          次回 {nextResetDate} にリセットされます。
        </span>
        <Button>アップグレード</Button>
      </div>
    </div>
  )
}

export { UsageCard }
