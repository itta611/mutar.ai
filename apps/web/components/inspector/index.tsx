"use client"

import { useAtom, useAtomValue } from "jotai"
import { BoldIcon, TypeIcon } from "lucide-react"

import {
  editorBoxesAtom,
  editorSelectedBoxIndexAtom,
  type EditorBox,
} from "@/atom/generate"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { resizeTextBox } from "@/hooks/editor-bbox"

const fonts = [
  { label: "ゴシック", value: "gothic" },
  { label: "明朝", value: "mincho" },
  { label: "丸ゴシック", value: "pop" },
] as const

function updateTextBox(
  boxes: EditorBox[],
  index: number,
  patch: Partial<
    Pick<
      EditorBox,
      | "bold"
      | "color"
      | "fontFamily"
      | "fontSize"
      | "letterSpacing"
      | "lineheight"
    >
  >
) {
  return boxes.map((box, boxIndex) =>
    boxIndex === index ? resizeTextBox({ ...box, ...patch }, box.label) : box
  )
}

export function Inspector() {
  const selectedIndex = useAtomValue(editorSelectedBoxIndexAtom)
  const [boxes, setBoxes] = useAtom(editorBoxesAtom)
  const box = selectedIndex === null ? null : boxes[selectedIndex]
  const selectedFont = fonts.find((font) => font.value === box?.fontFamily)

  function updateBox(
    patch: Partial<
      Pick<
        EditorBox,
        | "bold"
        | "color"
        | "fontFamily"
        | "fontSize"
        | "letterSpacing"
        | "lineheight"
      >
    >
  ) {
    if (selectedIndex === null) {
      return
    }

    setBoxes((current) => updateTextBox(current, selectedIndex, patch))
  }

  return (
    <div className="hidden w-72 border-l bg-background p-3 md:block">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <TypeIcon className="size-4" />
        インスペクタ
      </div>
      {box ? (
        <div className="space-y-3">
          <div className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              フォント
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    className="w-full justify-start"
                    type="button"
                    variant="outline"
                  >
                    {selectedFont?.label ?? "ゴシック"}
                  </Button>
                }
              />
              <DropdownMenuContent>
                <DropdownMenuRadioGroup
                  onValueChange={(fontFamily) =>
                    updateBox({
                      fontFamily: fontFamily as EditorBox["fontFamily"],
                    })
                  }
                  value={box.fontFamily ?? "gothic"}
                >
                  {fonts.map((font) => (
                    <DropdownMenuRadioItem key={font.value} value={font.value}>
                      {font.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              文字サイズ
            </span>
            <Input
              min={1}
              onChange={(event) => {
                const fontSize = Number(event.currentTarget.value)

                if (Number.isFinite(fontSize) && fontSize > 0) {
                  updateBox({ fontSize })
                }
              }}
              type="number"
              value={box.fontSize}
            />
          </div>
          <div className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              行間
            </span>
            <Input
              min={0.1}
              onChange={(event) => {
                const lineheight = Number(event.currentTarget.value)

                if (Number.isFinite(lineheight) && lineheight > 0) {
                  updateBox({ lineheight })
                }
              }}
              step={0.1}
              type="number"
              value={box.lineheight ?? 1.4}
            />
          </div>
          <div className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              字間
            </span>
            <Input
              onChange={(event) => {
                const letterSpacing = Number(event.currentTarget.value)

                if (Number.isFinite(letterSpacing)) {
                  updateBox({ letterSpacing })
                }
              }}
              step={0.1}
              type="number"
              value={box.letterSpacing ?? 0}
            />
          </div>
          <div className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              フォントカラー
            </span>
            <Input
              onChange={(event) =>
                updateBox({ color: event.currentTarget.value })
              }
              type="color"
              value={box.color?.startsWith("#") ? box.color : "#000000"}
            />
          </div>
          <Button
            aria-pressed={box.bold ?? false}
            className="w-full"
            onClick={() => updateBox({ bold: !(box.bold ?? false) })}
            type="button"
            variant={box.bold ? "secondary" : "outline"}
          >
            <BoldIcon className="size-4" />
            太字
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">テキストを選択</p>
      )}
    </div>
  )
}
