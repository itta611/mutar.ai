"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type AuthDialogContextValue = {
  isAuthDialogOpen: boolean
  setAuthDialogOpen: (open: boolean) => void
  openAuthDialog: () => void
  closeAuthDialog: () => void
}

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null)

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false)

  const openAuthDialog = useCallback(() => {
    setAuthDialogOpen(true)
  }, [])

  const closeAuthDialog = useCallback(() => {
    setAuthDialogOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      isAuthDialogOpen,
      setAuthDialogOpen,
      openAuthDialog,
      closeAuthDialog,
    }),
    [closeAuthDialog, isAuthDialogOpen, openAuthDialog]
  )

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
    </AuthDialogContext.Provider>
  )
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext)

  if (!context) {
    throw new Error("useAuthDialog must be used within AuthDialogProvider")
  }

  return context
}
