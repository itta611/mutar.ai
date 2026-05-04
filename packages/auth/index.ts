import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { magicLink } from "better-auth/plugins"

import { db } from "@hengen/db"
import * as schema from "@hengen/db/schema"
import { sendMagicLinkEmail } from "@hengen/email"
import { env } from "@/lib/env"

export const auth = betterAuth({
  secret: env.AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_BETTER_AUTH_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24 * 2,
  },
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    },
  },
  plugins: [
    nextCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ email, url })
      },
    }),
  ],
  advanced: {
    cookiePrefix: "hengen",
  },
})
