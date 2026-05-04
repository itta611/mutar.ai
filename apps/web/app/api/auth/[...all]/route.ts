import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@hengen/api/auth"

export const { GET, POST } = toNextJsHandler(auth)
