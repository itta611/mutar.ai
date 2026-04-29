import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    OPENROUTER_API_KEY: z.string().min(1),
    GOOGLE_CLOUD_PROJECT_ID: z.string().min(1),
    GOOGLE_CLOUD_CLIENT_EMAIL: z.string().min(1),
    GOOGLE_CLOUD_PRIVATE_KEY: z.string().min(1),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1),
    CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string(),
    RESEND_SECRET: z.string().min(1),
    RESEND_FROM: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  },
})
