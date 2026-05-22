"use client"

import { DownloadIcon, PencilLine, XIcon } from "lucide-react"
import { useAtomValue } from "jotai"
import { useRouter } from "next/navigation"

import { editorProjectTitleAtom } from "@/atom/generate"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const router = useRouter()
  const projectName = useAtomValue(editorProjectTitleAtom)

  return (
    <nav className="shrink-0 flex h-13 items-center bg-sidebar border-b border-border/70 pr-4 pl-2 gap-2">
      <Button
        aria-label="ホームに戻る"
        onClick={() => router.push("/home")}
        size="icon-lg"
        type="button"
        variant="ghost"
      >
        <XIcon />
      </Button>
      <div className="grow w-0 truncate">{projectName}</div>
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
    </nav>
  )
}
