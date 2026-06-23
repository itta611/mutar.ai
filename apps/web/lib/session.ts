import { headers } from "next/headers"

import { auth } from "@mutar/auth"

export async function getServerSession() {
  return auth.api.getSession({
    headers: new Headers(await headers()),
  })
}
