import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { createAuthEndpoint } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { nextCookies } from "better-auth/next-js"
import { magicLink } from "better-auth/plugins"

import { db } from "@mutar/db"
import * as schema from "@mutar/db/schema"
import { sendMagicLinkEmail } from "@mutar/email"
import { env } from "@/lib/env"

const betaLogin = {
  id: "beta-login",
  endpoints: {
    betaLogin: createAuthEndpoint(
      "/beta-login",
      { method: "POST" },
      async (ctx) => {
        const email = "test@test.com"
        const existingUser =
          await ctx.context.internalAdapter.findUserByEmail(email)
        const user =
          existingUser?.user ??
          (await ctx.context.internalAdapter.createUser({
            email,
            emailVerified: true,
            name: "Test",
          }))
        const session = await ctx.context.internalAdapter.createSession(user.id)

        await setSessionCookie(ctx, { session, user })

        return ctx.json({ success: true })
      }
    ),
  },
}

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
    freshAge: 0,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
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
    betaLogin,
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ email, url })
      },
    }),
  ],
  advanced: {
    cookiePrefix: "mutar",
  },
})
