import { NextResponse, type NextRequest } from "next/server"

import { getServerSession } from "./lib/session"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getServerSession()

  if (session && pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  if (!session && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
