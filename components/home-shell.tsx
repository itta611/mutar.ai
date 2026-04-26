"use client"

import { ArrowRight } from "lucide-react"
import { startTransition, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthDialog } from "@/hooks/use-auth-dialog"
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
  const { openAuthDialog } = useAuthDialog()
  const session = authClient.useSession()
  const user = session.data?.user ?? initialUser
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleGenerate() {
    if (!user) {
      openAuthDialog()
      return
    }

    setIsGenerating(true)

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
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Textarea
        id="generation-prompt"
        name="prompt"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        className="min-h-40 resize-none"
        placeholder="作りたい資料画像を自然文で書いてください。"
      />
      <Button
        size="lg"
        onClick={handleGenerate}
        disabled={isGenerating || prompt.trim().length < 12}
      >
        {isGenerating ? "画像を生成しています..." : "生成して編集を始める"}
        <ArrowRight data-icon="inline-end" />
      </Button>
    </>
  )
}
