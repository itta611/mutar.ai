"use client"

import { X } from "lucide-react"
import { useEffect, useState } from "react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthDialog } from "@/hooks/use-auth-dialog"

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

    const result = await authClient.signIn.magicLink({
      email: email.trim(),
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm"
      onClick={closeAuthDialog}
    >
      <div
        className="relative w-full max-w-md rounded-[2rem] border border-white/50 bg-[#f8f4ec] p-6 shadow-[0_40px_120px_rgba(15,15,15,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeAuthDialog}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-black/70 transition hover:bg-white"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="space-y-3 pr-8">
          <p className="text-xs font-medium tracking-[0.22em] text-black/45 uppercase">
            BetterAuth
          </p>
          <h2 className="font-heading text-3xl tracking-tight text-black">
            続けるにはログイン
          </h2>
          <p className="text-sm leading-6 text-black/60">
            Google かメールのマジックリンクだけで入れるようにしています。
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={busyMode !== null}
          >
            {busyMode === "google"
              ? "Google を開いています..."
              : "Google アカウントでログイン"}
          </Button>

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
            type="button"
            variant="outline"
            size="lg"
            onClick={handleMagicLink}
            disabled={busyMode !== null || !email.trim()}
          >
            {busyMode === "email" ? "リンクを発行しています..." : "続ける"}
          </Button>
        </div>

        {message ? (
          <p className="mt-4 rounded-2xl bg-[#ede5d9] px-4 py-3 text-sm leading-6 text-black/70">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl bg-[#f4d7d4] px-4 py-3 text-sm leading-6 text-[#7a2f26]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
