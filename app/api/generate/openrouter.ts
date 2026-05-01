import { createOpenRouter } from "@openrouter/ai-sdk-provider"

import { env } from "@/lib/env"

export const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
  appName: "Hengen",
  appUrl: env.NEXT_PUBLIC_BETTER_AUTH_URL,
  compatibility: "strict",
})
