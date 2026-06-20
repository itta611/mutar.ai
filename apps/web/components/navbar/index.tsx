"use client"

import { DownloadIcon, PencilLine, XIcon } from "lucide-react"
import { useAtomValue } from "jotai"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { editorBoxesAtom, fontFamilyMap } from "@/atom/generate"
import { Button } from "@/components/ui/button"
import { editorProjectQuery } from "@/hooks/use-editor-project"

function getTextWidth(
  context: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number
) {
  return (
    context.measureText(text).width + Array.from(text).length * letterSpacing
  )
}

function fillText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number
) {
  if (letterSpacing === 0) {
    context.fillText(text, x, y)
    return
  }

  const chars = Array.from(text)
  const width = getTextWidth(context, text, letterSpacing)
  const textAlign = context.textAlign
  let currentX =
    textAlign === "right"
      ? x - width
      : textAlign === "center"
        ? x - width / 2
        : x

  context.textAlign = "left"
  for (const char of chars) {
    context.fillText(char, currentX, y)
    currentX += context.measureText(char).width + letterSpacing
  }
  context.textAlign = textAlign
}

export function Navbar() {
  const router = useRouter()
  const { projectId } = useParams<{ projectId: string }>()
  const boxes = useAtomValue(editorBoxesAtom)
  const { data: project } = useQuery(editorProjectQuery(projectId))
  const imageSize =
    project?.status === "ready"
      ? ([project.width, project.height] as const)
      : null
  const projectName = project?.title ?? ""
  const [isSaving, setIsSaving] = useState(false)

  async function handleSaveImage() {
    if (!projectId || !imageSize || isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const image = new Image()
      image.decoding = "async"
      image.src = `/api/projects/${projectId}/image`
      await image.decode()

      const [width, height] = imageSize
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext("2d")
      if (!context) {
        throw new Error("canvas_unavailable")
      }

      context.drawImage(image, 0, 0, width, height)

      for (const box of boxes) {
        const xs = box.bbox.map((point) => point.x ?? 0)
        const ys = box.bbox.map((point) => point.y ?? 0)
        const left = Math.min(...xs)
        const top = Math.min(...ys)
        const boxWidth = Math.max(...xs) - left
        const boxHeight = Math.max(...ys) - top
        const fontSize = box.fontSize
        const letterSpacing = box.letterSpacing ?? 0
        const lineheight = box.lineheight ?? 1.4
        const lineHeight = fontSize * lineheight
        const fontFamily = fontFamilyMap[box.fontFamily ?? "gothic"]
        const lines = box.wrapText
          ? box.label.split("\n").flatMap((line) => {
              const wrappedLines: string[] = []
              let currentLine = ""

              for (const char of Array.from(line)) {
                const nextLine = currentLine + char
                context.font = `${box.bold ? 700 : 400} ${fontSize}px ${fontFamily}`

                if (
                  currentLine &&
                  getTextWidth(context, nextLine, letterSpacing) > boxWidth
                ) {
                  wrappedLines.push(currentLine)
                  currentLine = char
                } else {
                  currentLine = nextLine
                }
              }

              return currentLine ? [...wrappedLines, currentLine] : wrappedLines
            })
          : box.label.split("\n")
        const align = box.align ?? "center"
        const x =
          align === "left"
            ? left
            : align === "right"
              ? left + boxWidth
              : left + boxWidth / 2
        const y = top + boxHeight / 2 - ((lines.length - 1) * lineHeight) / 2

        context.fillStyle = box.color ?? "rgba(0,0,0,1)"
        context.font = `${box.bold ? 700 : 400} ${fontSize}px ${fontFamily}`
        context.textAlign = align
        context.textBaseline = "middle"

        lines.forEach((line, index) => {
          fillText(context, line, x, y + index * lineHeight, letterSpacing)
        })
      }

      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `${projectName || "image"}.png`
      link.click()
    } catch {
      toast.error("画像の保存に失敗しました")
    } finally {
      setIsSaving(false)
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
      <Button aria-label="コピー" type="button" variant="outline">
        コピー
      </Button>
      <Button
        disabled={!projectId || !imageSize || isSaving}
        onClick={handleSaveImage}
        type="button"
      >
        <DownloadIcon />
        {isSaving ? "保存中" : "画像を保存"}
      </Button>
    </nav>
  )
}
