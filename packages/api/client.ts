import { hc } from "hono/client"

import type { AppType } from "."

export const apiClient = hc<AppType>("/api", {
  init: {
    credentials: "include",
  },
})
