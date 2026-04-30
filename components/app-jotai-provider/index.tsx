"use client"

import { Provider } from "jotai"

export function AppJotaiProvider({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>
}
