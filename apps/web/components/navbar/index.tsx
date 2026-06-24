"use client"

import { DownloadIcon, XIcon } from "lucide-react"
import { useAtomValue } from "jotai"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { editorBoxesAtom } from "@/atom/generate"
import { Button } from "@/components/ui/button"
import { useExport } from "@/hooks/use-export"
import { editorProjectQuery } from "@/hooks/use-editor-project"
import { CopyButton } from "./copy-button"

export function Navbar() {
  const router = useRouter()
  const { projectId } = useParams<{ projectId: string }>()
  const boxes = useAtomValue(editorBoxesAtom)
  const { data: project } = useQuery(editorProjectQuery(projectId))
  const imageSize =
    project?.status === "ready"
      ? ([project.width, project.height] as [number, number])
      : null
  const projectName = project?.title ?? ""
  const { copyPng, copySvg, downloadPng, isExporting } = useExport({
    boxes,
    imageSize,
    projectId,
    projectName,
  })
  const disabled = !projectId || !imageSize || isExporting

  async function handleDownloadPng() {
    try {
      await downloadPng()
    } catch {
      toast.error("画像の保存に失敗しました")
    }
  }

  return (
    <nav className="shrink-0 flex h-13 items-center bg-sidebar border-b border-border/70 pr-4 pl-2 gap-2">
      <Button
        aria-label="ホームに戻る"
        className="hidden sm:inline-flex"
        onClick={() => router.push("/home")}
        size="icon-lg"
        type="button"
        variant="ghost"
      >
        <XIcon />
      </Button>
      <div className="grow w-0 truncate">{projectName}</div>
      <CopyButton
        disabled={disabled}
        onCopyImage={async () => {
          await copyPng()
          toast("コピーしました")
        }}
        onCopySvg={async () => {
          await copySvg()
          toast("コピーしました")
        }}
      />
      <Button
        disabled={disabled}
        onClick={handleDownloadPng}
        type="button"
      >
        <DownloadIcon />
        {isExporting ? "保存中" : "画像を保存"}
      </Button>
    </nav>
  )
}
