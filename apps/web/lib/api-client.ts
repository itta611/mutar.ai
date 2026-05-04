import { hc } from "hono/client"

import type { AppType } from "@hengen/api"

export const apiClient = hc<AppType>("/api", {
  init: {
    credentials: "include",
  },
})
