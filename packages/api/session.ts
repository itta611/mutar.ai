import { auth } from "@hengen/auth"

export function getSession(headers: Headers) {
  return auth.api.getSession({ headers })
}
