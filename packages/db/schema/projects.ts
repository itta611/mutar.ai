import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { accounts, sessions, users } from "./auth"

export const projects = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    title: text("title").notNull(),
    aspectRatio: text("aspectRatio").notNull().default("4:3"),
    model: text("model").notNull().default("openai/gpt-5.4-image-2"),
    status: text("status").notNull().default("ready"),
    isStarred: boolean("isStarred").notNull().default(false),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    analysis: jsonb("analysis")
      .$type<{ boxes: unknown[]; summary: string }>()
      .notNull()
      .default({ boxes: [], summary: "" }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deletedAt", { withTimezone: true }),
  },
  (table) => [
    index("project_user_idx").on(table.userId, table.createdAt.desc()),
  ]
)

export const userRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  sessions: many(sessions),
  accounts: many(accounts),
}))

export const projectRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}))

export type Project = typeof projects.$inferSelect
