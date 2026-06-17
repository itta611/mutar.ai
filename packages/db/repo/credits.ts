import { and, eq, gte, sql } from "drizzle-orm"

import { db } from ".."
import { creditLedger, users } from "../schema"

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function resetDate(year: number, month: number, resetDay: number) {
  return new Date(
    Date.UTC(year, month, Math.min(resetDay, daysInMonth(year, month)))
  )
}

function getCreditPeriodStart(createdAt: Date, now = new Date()) {
  const resetDay = Math.min(createdAt.getUTCDate(), 30)
  let periodStart = resetDate(now.getUTCFullYear(), now.getUTCMonth(), resetDay)

  if (periodStart > now) {
    periodStart = resetDate(
      now.getUTCFullYear(),
      now.getUTCMonth() - 1,
      resetDay
    )
  }

  return { periodStart, resetDay }
}

export async function getCreditUsageByUserId(userId: string) {
  const [user] = await db
    .select({ createdAt: users.createdAt, creditQuota: users.creditQuota })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    return null
  }

  const { periodStart, resetDay } = getCreditPeriodStart(user.createdAt)
  const [usage] = await db
    .select({
      used: sql<number>`
        coalesce(sum(
          case
            when ${creditLedger.state} = 'succeeded' then ${creditLedger.amount}
            when ${creditLedger.state} = 'loading'
              and ${creditLedger.createdAt} >= now() - interval '1 hour'
              and not exists (
                select 1
                from credit_ledger cancellations
                where cancellations."projectId" = ${creditLedger.projectId}
                  and cancellations.state = 'canceled'
              )
            then ${creditLedger.amount}
            else 0
          end
        ), 0)
      `.mapWith(Number),
    })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.userId, userId),
        gte(creditLedger.createdAt, periodStart)
      )
    )

  return {
    quota: user.creditQuota,
    periodStart,
    resetDay,
    used: usage?.used ?? 0,
  }
}
