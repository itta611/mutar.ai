"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthDialog } from "@/hooks/use-auth-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog"
import LogoIcon from "../logo-icon"

function getNameFromEmail(email: string) {
  const localPart = email.trim().split("@")[0]?.trim()

  if (!localPart) {
    return ""
  }

  return localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase()
}

export function AuthDialog() {
  const { closeAuthDialog, isAuthDialogOpen } = useAuthDialog()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyMode, setBusyMode] = useState<"email" | "google" | null>(null)

  useEffect(() => {
    if (!isAuthDialogOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isAuthDialogOpen])

  if (!isAuthDialogOpen) {
    return null
  }

  const callbackURL =
    typeof window === "undefined" ? "/" : window.location.toString()

  async function handleGoogleLogin() {
    setBusyMode("google")
    setError(null)

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    })

    setBusyMode(null)

    if (result.error) {
      setError("Google ログインを開始できませんでした。")
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError("メールアドレスを入力してください。")
      return
    }

    setBusyMode("email")
    setError(null)

    if (email.trim().toLowerCase() === "test@test.com") {
      const response = await fetch("/api/auth/beta-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })

      if (response.ok) {
        window.location.href = callbackURL
        return
      }

      setBusyMode(null)
      setError("ログインできませんでした。")
      return
    }

    const result = await authClient.signIn.magicLink({
      email: email.trim(),
      name: getNameFromEmail(email),
      callbackURL,
    })

    setBusyMode(null)

    if (result.error) {
      setError(
        "マジックリンクを送信できませんでした。時間をおいて再度お試しください。"
      )
      return
    }

    setMessage(
      "マジックリンクをメールで送信しました。受信ボックスを確認してください。"
    )
  }

  return (
    <Dialog
      open={isAuthDialogOpen}
      onOpenChange={(open) => !open && closeAuthDialog()}
    >
      <DialogContent className="sm:max-w-108 px-10 pb-11 pt-12">
        <LogoIcon width={40} height={40} className="mx-auto" />
        <DialogTitle className="text-xl font-bold text-center">
          ログイン・新規登録
        </DialogTitle>
        <DialogDescription className="text-center">
          続行するにはログインまたは新規登録してください。
        </DialogDescription>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={busyMode === "google"}
          >
            <Image src="/google-icon.svg" alt="" width={18} height={18} />
            Google アカウントでログイン
          </Button>

          <div className="flex items-center h-12">
            <div className="h-px flex-1 bg-border" />
            <span className="mx-3 text-sm text-muted-foreground">または</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              handleMagicLink()
            }}
          >
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />

            <Button
              type="submit"
              size="lg"
              disabled={busyMode === "email"}
            >
              {busyMode === "email" ? "リンクを発行しています..." : "続ける"}
            </Button>
          </form>
        </div>

        {message ? (
          <p className="mt-4 rounded-xl px-4 text-sm leading-6 text-black/70">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl px-4 text-sm leading-6 text-red-500">
            {error}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
