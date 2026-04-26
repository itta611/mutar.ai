"use client"

import { ArrowRight, BrushCleaning, FileType2, MoveRight } from "lucide-react"
import { startTransition, useDeferredValue, useState } from "react"
import { useRouter } from "next/navigation"

import { AuthDialog } from "@/components/auth-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { authClient } from "@/lib/auth-client"

type HomeShellProps = {
  initialUser: {
    id: string
    name: string
    email: string
    image?: string | null
  } | null
}

const defaultPrompt =
  "SaaSの料金プラン比較を、落ち着いたベージュと黒でまとめた横長スライド。大見出し、3カラム比較表、右下にCTA、洗練されたエディトリアルデザイン。"

export function HomeShell({ initialUser }: HomeShellProps) {
  const router = useRouter()
  const session = authClient.useSession()
  const user = session.data?.user ?? initialUser
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deferredPrompt = useDeferredValue(prompt)

  async function handleGenerate() {
    if (!user) {
      setIsDialogOpen(true)
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      })

      if (!response.ok) {
        throw new Error("generate_failed")
      }

      const data = (await response.json()) as { projectId: string }

      startTransition(() => {
        router.push(`/studio/${data.projectId}`)
      })
    } catch {
      setError("生成に失敗しました。モデル応答か認証状態を確認してください。")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <div className="relative overflow-hidden">
        <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-12">
          <header className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-medium tracking-[0.24em] text-black/45 uppercase">
                Hengen
              </p>
              <p className="mt-1 text-sm text-black/55">
                AI image composition for decks and posters
              </p>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-black/65">
                  {user.name ?? user.email}
                </div>
              ) : null}
              <Button
                variant="outline"
                onClick={() =>
                  user ? router.push("/") : setIsDialogOpen(true)
                }
              >
                {user ? "ログイン済み" : "ログイン"}
              </Button>
            </div>
          </header>

          <main className="flex flex-1 flex-col justify-center pt-12 pb-10">
            <section className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
              <div className="max-w-3xl space-y-6">
                <p className="text-xs font-medium tracking-[0.24em] text-black/45 uppercase">
                  OpenRouter + Vercel AI SDK
                </p>
                <h1 className="font-heading text-5xl leading-[0.95] tracking-tight text-black sm:text-6xl lg:text-7xl">
                  スライド用に
                  <br />
                  AI画像を作って、あとから文字だけ直す。
                </h1>
                <p className="mx-auto max-w-2xl text-sm leading-7 text-black/60 sm:text-base">
                  先に画像を生成し、Gemini
                  系モデルで文字位置を推定し、文字を抜いた背景を再生成します。最後はキャンバス上でテキストだけを動かして整えます。
                </p>
              </div>

              <div className="mt-12 w-full rounded-[2rem] border border-white/60 bg-[#f7f2e9]/90 p-4 shadow-[0_35px_120px_rgba(20,20,20,0.10)] sm:p-6">
                <div className="rounded-[1.7rem] border border-black/6 bg-white/70 p-4 sm:p-5">
                  <Textarea
                    id="generation-prompt"
                    name="prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="min-h-40 resize-none"
                    placeholder="作りたい資料画像を自然文で書いてください。"
                  />

                  <div className="mt-4 flex flex-col gap-3 border-t border-black/6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2 text-left">
                      <span className="rounded-full bg-black/[0.04] px-3 py-1 text-xs text-black/55">
                        4:3 スライド前提
                      </span>
                      <span className="rounded-full bg-black/[0.04] px-3 py-1 text-xs text-black/55">
                        Calm editorial
                      </span>
                      <span className="rounded-full bg-black/[0.04] px-3 py-1 text-xs text-black/55">
                        Text re-editable
                      </span>
                    </div>

                    <Button
                      size="lg"
                      onClick={handleGenerate}
                      disabled={isGenerating || prompt.trim().length < 12}
                    >
                      {isGenerating
                        ? "画像を生成しています..."
                        : "生成して編集を始める"}
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </div>
                </div>

                {error ? (
                  <p className="mt-4 rounded-2xl bg-[#f4d7d4] px-4 py-3 text-left text-sm leading-6 text-[#7a2f26]">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="mt-8 grid w-full gap-4 text-left lg:grid-cols-3">
                <div className="rounded-[1.7rem] border border-black/8 bg-white/55 p-5">
                  <FileType2 className="size-5 text-black/55" />
                  <p className="mt-4 text-sm font-medium text-black">
                    資料向けの画像生成
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/58">
                    イラストよりも、スライドやポスターとしてそのまま使える構図に寄せます。
                  </p>
                </div>
                <div className="rounded-[1.7rem] border border-black/8 bg-white/55 p-5">
                  <BrushCleaning className="size-5 text-black/55" />
                  <p className="mt-4 text-sm font-medium text-black">
                    埋め込み文字を背景から分離
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/58">
                    文字位置を推定したあと、背景画像から文字だけを抜いた状態をもう一枚作ります。
                  </p>
                </div>
                <div className="rounded-[1.7rem] border border-black/8 bg-white/55 p-5">
                  <MoveRight className="size-5 text-black/55" />
                  <p className="mt-4 text-sm font-medium text-black">
                    テキストだけあと編集
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/58">
                    TipTap
                    ベースの浮遊ツールバーで、文言、位置、フォントだけを素早く整えます。
                  </p>
                </div>
              </div>

              <div className="mt-10 w-full max-w-4xl rounded-[1.7rem] border border-black/6 bg-[#efe7d8]/60 p-5 text-left">
                <p className="text-xs font-medium tracking-[0.18em] text-black/45 uppercase">
                  Prompt snapshot
                </p>
                <p className="mt-3 font-heading text-2xl leading-tight text-black/85">
                  {deferredPrompt || "まだプロンプトがありません"}
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>

      {isDialogOpen ? (
        <AuthDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      ) : null}
    </>
  )
}
