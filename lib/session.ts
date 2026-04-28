import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export async function getServerSession() {
  return auth.api.getSession({
    headers: new Headers(await headers()),
  })
}

export async function requireServerSession() {
  const session = await getServerSession()

  if (!session) {
    redirect("/")
  }

  return session
}
