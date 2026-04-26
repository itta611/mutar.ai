import { sql } from "drizzle-orm"

import { db } from "@/db"

let setupPromise: Promise<void> | null = null

const statements = [
  sql`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" text PRIMARY KEY,
      "name" text,
      "email" text NOT NULL UNIQUE,
      "emailVerified" boolean NOT NULL DEFAULT false,
      "image" text,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "id" text PRIMARY KEY,
      "expiresAt" timestamp with time zone NOT NULL,
      "token" text NOT NULL UNIQUE,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
      "ipAddress" text,
      "userAgent" text,
      "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "account" (
      "id" text PRIMARY KEY,
      "accountId" text NOT NULL,
      "providerId" text NOT NULL,
      "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "accessToken" text,
      "refreshToken" text,
      "idToken" text,
      "accessTokenExpiresAt" timestamp with time zone,
      "refreshTokenExpiresAt" timestamp with time zone,
      "scope" text,
      "password" text,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_account_idx"
    ON "account" ("providerId", "accountId")
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" text PRIMARY KEY,
      "identifier" text NOT NULL,
      "value" text NOT NULL,
      "expiresAt" timestamp with time zone NOT NULL,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "project" (
      "id" text PRIMARY KEY,
      "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "prompt" text NOT NULL,
      "status" text NOT NULL DEFAULT 'ready',
      "originalImageKey" text NOT NULL,
      "cleanedImageKey" text,
      "width" integer NOT NULL,
      "height" integer NOT NULL,
      "analysis" jsonb NOT NULL DEFAULT '{"boxes":[],"summary":""}'::jsonb,
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE INDEX IF NOT EXISTS "project_user_idx"
    ON "project" ("userId", "createdAt" DESC)
  `,
  sql`
    CREATE TABLE IF NOT EXISTS "textBox" (
      "id" text PRIMARY KEY,
      "projectId" text NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
      "content" text NOT NULL,
      "x" double precision NOT NULL,
      "y" double precision NOT NULL,
      "width" double precision NOT NULL,
      "height" double precision NOT NULL,
      "fontFamily" text NOT NULL,
      "fontSize" integer NOT NULL,
      "color" text NOT NULL DEFAULT '#111111',
      "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
    )
  `,
  sql`
    CREATE INDEX IF NOT EXISTS "textbox_project_idx"
    ON "textBox" ("projectId")
  `,
]

async function runSetup() {
  for (const statement of statements) {
    await db.execute(statement)
  }
}

export async function ensureDatabaseSetup() {
  if (!setupPromise) {
    setupPromise = runSetup()
  }

  await setupPromise
}
