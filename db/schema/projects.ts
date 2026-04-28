import { relations } from "drizzle-orm"
import {
  doublePrecision,
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
    status: text("status").notNull().default("ready"),
    originalImageKey: text("originalImageKey").notNull(),
    cleanedImageKey: text("cleanedImageKey"),
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
  },
  (table) => [
    index("project_user_idx").on(table.userId, table.createdAt.desc()),
  ]
)

export const textBoxes = pgTable(
  "textBox",
  {
    id: text("id").primaryKey(),
    projectId: text("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    x: doublePrecision("x").notNull(),
    y: doublePrecision("y").notNull(),
    width: doublePrecision("width").notNull(),
    height: doublePrecision("height").notNull(),
    fontFamily: text("fontFamily").notNull(),
    fontSize: integer("fontSize").notNull(),
    color: text("color").notNull().default("#111111"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("textbox_project_idx").on(table.projectId)]
)

export const userRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  sessions: many(sessions),
  accounts: many(accounts),
}))

export const projectRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  textBoxes: many(textBoxes),
}))

export const textBoxRelations = relations(textBoxes, ({ one }) => ({
  project: one(projects, {
    fields: [textBoxes.projectId],
    references: [projects.id],
  }),
}))

export type Project = typeof projects.$inferSelect
export type TextBox = typeof textBoxes.$inferSelect
