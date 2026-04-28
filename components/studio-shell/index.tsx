"use client"

import Image from "next/image"
import { Check, Layers3, Loader2, Save } from "lucide-react"
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { editorFonts } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { TextLayer } from "@/components/text-layer"

export type StudioBox = {
  id: string
  content: string
  x: number
  y: number
  width: number
  height: number
  fontFamily: string
  fontSize: number
  color: string
}

type StudioShellProps = {
  project: {
    id: string
    prompt: string
    width: number
    height: number
  }
  initialBoxes: StudioBox[]
}

type DragState = {
  id: string
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function textFromHtml(content: string) {
  return content
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function clampBoxToCanvas(box: StudioBox) {
  const width = clamp(box.width, 0.02, 1)
  const height = clamp(box.height, 0.02, 1)
  const x = clamp(box.x, 0, 1 - width)
  const y = clamp(box.y, 0, 1 - height)

  return {
    ...box,
    x,
    y,
    width,
    height,
  }
}

export function StudioShell({ project, initialBoxes }: StudioShellProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [stageWidth, setStageWidth] = useState(project.width)
  const [boxes, setBoxes] = useState(() => initialBoxes.map(clampBoxToCanvas))
  const [selectedId, setSelectedId] = useState<string | null>(
    initialBoxes[0]?.id ?? null
  )
  const [imageVariant, setImageVariant] = useState<"cleaned" | "original">(
    "cleaned"
  )
  const [isDragging, setIsDragging] = useState(false)
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")

  const selectedBox = useMemo(
    () => boxes.find((box) => box.id === selectedId) ?? null,
    [boxes, selectedId]
  )
  const stageScale = stageWidth > 0 ? stageWidth / project.width : 1

  const handlePointerMove = useEffectEvent((event: PointerEvent) => {
    if (!dragRef.current || !containerRef.current) {
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const drag = dragRef.current
    const deltaX = (event.clientX - drag.startX) / rect.width
    const deltaY = (event.clientY - drag.startY) / rect.height

    setBoxes((currentBoxes) =>
      currentBoxes.map((box) => {
        if (box.id !== drag.id) {
          return box
        }

        return {
          ...box,
          x: clamp(drag.originX + deltaX, 0, 1 - box.width),
          y: clamp(drag.originY + deltaY, 0, 1 - box.height),
        }
      })
    )
  })

  const handlePointerUp = useEffectEvent(() => {
    dragRef.current = null
    setIsDragging(false)
  })

  useEffect(() => {
    if (!isDragging) {
      return
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [isDragging])

  useEffect(() => {
    const element = containerRef.current

    if (!element) {
      return
    }

    function updateStageWidth() {
      setStageWidth(element?.getBoundingClientRect().width ?? project.width)
    }

    updateStageWidth()

    const observer = new ResizeObserver(() => {
      updateStageWidth()
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [project.width])

  useEffect(() => {
    if (saveState !== "saved") {
      return
    }

    const timeout = window.setTimeout(() => {
      setSaveState("idle")
    }, 1800)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [saveState])

  function handleContentChange(id: string, content: string) {
    setBoxes((currentBoxes) =>
      currentBoxes.map((box) => (box.id === id ? { ...box, content } : box))
    )
  }

  function handleStartDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    id: string
  ) {
    event.preventDefault()
    event.stopPropagation()

    const box = boxes.find((item) => item.id === id)

    if (!box) {
      return
    }

    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: box.x,
      originY: box.y,
    }

    setSelectedId(id)
    setIsDragging(true)
  }

  function applyFont(fontFamily: string) {
    if (!selectedId) {
      return
    }

    setBoxes((currentBoxes) =>
      currentBoxes.map((box) =>
        box.id === selectedId ? { ...box, fontFamily } : box
      )
    )
  }

  async function handleSave() {
    setSaveState("saving")

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boxes,
        }),
      })

      if (!response.ok) {
        throw new Error("save_failed")
      }

      startTransition(() => {
        setSaveState("saved")
      })
    } catch {
      setSaveState("error")
    }
  }

  return (
    <div className="min-h-svh bg-background px-4 py-4 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1680px] gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
          <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
                Editor
              </p>
              <h1 className="mt-2 font-heading text-3xl leading-none">
                Text editor
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={imageVariant === "cleaned" ? "default" : "outline"}
                onClick={() => setImageVariant("cleaned")}
              >
                背景のみ
              </Button>
              <Button
                type="button"
                variant={imageVariant === "original" ? "default" : "outline"}
                onClick={() => setImageVariant("original")}
              >
                元画像
              </Button>
              <Button onClick={handleSave}>
                {saveState === "saving" ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : saveState === "saved" ? (
                  <Check data-icon="inline-start" />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                {saveState === "saving"
                  ? "保存中..."
                  : saveState === "saved"
                    ? "保存済み"
                    : "変更を保存"}
              </Button>
            </div>
          </div>

          {selectedBox ? (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  選択中のテキスト
                </p>
                <p className="truncate text-sm font-medium">
                  {textFromHtml(selectedBox.content) || "空のテキスト"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {editorFonts.map((font) => (
                  <Button
                    key={font.value}
                    type="button"
                    size="sm"
                    variant={
                      selectedBox.fontFamily === font.value
                        ? "default"
                        : "outline"
                    }
                    onClick={() => applyFont(font.value)}
                  >
                    {font.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-lg border bg-muted"
              style={{ aspectRatio: `${project.width} / ${project.height}` }}
            >
              <Image
                fill
                priority
                unoptimized
                src={`/api/projects/${project.id}/image?variant=${imageVariant}`}
                alt="Generated project background"
                className="object-cover"
                sizes="(min-width: 1280px) 70vw, 100vw"
              />

              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute top-0 left-0"
                  style={{
                    width: project.width,
                    height: project.height,
                    transform: `scale(${stageScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  {boxes.map((box) => (
                    <TextLayer
                      key={box.id}
                      {...box}
                      canvasWidth={project.width}
                      canvasHeight={project.height}
                      selected={box.id === selectedId}
                      onSelect={setSelectedId}
                      onContentChange={handleContentChange}
                      onStartDrag={handleStartDrag}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-xl border bg-card p-5 shadow-xs xl:sticky xl:top-4 xl:max-h-[calc(100svh-2rem)] xl:overflow-auto">
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
            Project
          </p>
          <h2 className="mt-2 font-heading text-3xl leading-none">
            Hengen Studio
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            文字レイヤーを選択して編集します。移動ハンドルは選択中のレイヤーだけに表示されます。
          </p>

          <div className="mt-6 rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Prompt
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {project.prompt}
            </p>
          </div>

          <div className="mt-5 rounded-lg border">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Layers3 className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">Text layers</p>
              <span className="ml-auto text-xs text-muted-foreground">
                {boxes.length}
              </span>
            </div>
            <div className="max-h-80 overflow-auto p-2">
              {boxes.map((box) => (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => setSelectedId(box.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted",
                    box.id === selectedId && "bg-muted"
                  )}
                >
                  <span className="mt-1 size-2 rounded-full bg-foreground/50" />
                  <span className="min-w-0 flex-1 truncate">
                    {textFromHtml(box.content) || "空のテキスト"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg border p-4">
            <p className="text-sm font-medium">保存状態</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {saveState === "saving"
                ? "Neon に保存中です。"
                : saveState === "saved"
                  ? "最新のテキストレイヤーを保存しました。"
                  : saveState === "error"
                    ? "保存に失敗しました。"
                    : "編集後に保存すると、次回も同じレイアウトで開けます。"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
