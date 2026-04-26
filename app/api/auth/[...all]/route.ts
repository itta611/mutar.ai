import { toNextJsHandler } from "better-auth/next-js"

import { ensureDatabaseSetup } from "@/db/setup"
import { auth } from "@/lib/auth"

const handlers = toNextJsHandler(auth)

async function withSetup<T>(handler: (request: Request) => Promise<T>, request: Request) {
  await ensureDatabaseSetup()
  return handler(request)
}

export const GET = async (request: Request) => withSetup(handlers.GET, request)
export const POST = async (request: Request) => withSetup(handlers.POST, request)
