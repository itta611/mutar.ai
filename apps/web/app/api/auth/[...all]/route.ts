import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@mutar/auth"

export const { GET, POST } = toNextJsHandler(auth)
