"use client"

import { DownloadIcon, PencilLine, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function Navbar() {
  const router = useRouter()
  const projectName = "プロジェクト名"

  return (
    <nav className="shrink-0 flex h-13 items-center bg-sidebar border-b border-border/70 pr-4 pl-2">
      <Button
        aria-label="ホームに戻る"
        onClick={() => router.push("/home")}
        size="icon-lg"
        type="button"
        variant="ghost"
      >
        <XIcon />
      </Button>
      <div className="grow pl-1">{projectName}</div>
      <div className="flex flex-row-reverse items-center gap-2">
        <Button type="button">
          <DownloadIcon />
          画像を保存
        </Button>
        <Button aria-label="コピー" type="button" variant="outline">
          コピー
        </Button>
        <Button type="button" variant="outline">
          <PencilLine />
          修正
        </Button>
      </div>
    </nav>
  )
}
