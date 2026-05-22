"use client"

import { CopyIcon, PencilIcon, SaveIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function Navbar() {
  const router = useRouter()

  return (
    <nav className="shrink-0 flex h-13 items-center justify-between bg-sidebar border-b border-border/70 px-4">
      <Button
        aria-label="ホームに戻る"
        onClick={() => router.push("/home")}
        size="icon"
        type="button"
        variant="ghost"
      >
        <XIcon />
      </Button>
      <div className="flex flex-row-reverse items-center gap-2">
        <Button type="button">
          <SaveIcon />
          保存
        </Button>
        <Button aria-label="コピー" size="icon" type="button" variant="outline">
          <CopyIcon />
        </Button>
        <Button type="button" variant="outline">
          <PencilIcon />
          修正
        </Button>
      </div>
    </nav>
  )
}
