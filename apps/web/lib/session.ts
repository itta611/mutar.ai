import { headers } from "next/headers"

import { auth } from "@hengen/auth"

export async function getServerSession() {
  return auth.api.getSession({
    headers: new Headers(await headers()),
  })
}
