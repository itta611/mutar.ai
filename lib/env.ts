import { z } from "zod"

const serverEnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_IMAGE_MODEL: z.string().default("openai/gpt-5-image"),
  OPENROUTER_TEXT_MODEL: z.string().default("google/gemini-2.5-flash"),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url(),
  RESEND_SECRET: z.string().min(1),
  RESEND_FROM: z.string().min(1),
})

export const env = serverEnvSchema.parse({
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_IMAGE_MODEL: process.env.OPENROUTER_IMAGE_MODEL,
  OPENROUTER_TEXT_MODEL: process.env.OPENROUTER_TEXT_MODEL,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME,
  CLOUDFLARE_R2_ACCESS_KEY_ID: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  RESEND_SECRET: process.env.RESEND_SECRET,
  RESEND_FROM: process.env.RESEND_FROM,
})
