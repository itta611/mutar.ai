import { hc } from "hono/client"

import type { AppType } from "@mutar/api"

export const apiClient = hc<AppType>("/api", {
  init: {
    credentials: "include",
  },
})
