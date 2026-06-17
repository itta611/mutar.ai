import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { users } from "./auth"

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("projectId"),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    state: text("state").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("credit_ledger_user_created_idx").on(table.userId, table.createdAt),
  ]
)
