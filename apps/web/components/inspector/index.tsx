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
  patch: Partial<Pick<EditorBox, "bold" | "fontFamily" | "fontSize">>
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
    patch: Partial<Pick<EditorBox, "bold" | "fontFamily" | "fontSize">>
  ) {
    if (selectedIndex === null) {
      return
    }

    setBoxes((current) => updateTextBox(current, selectedIndex, patch))
  }

  return (
    <aside className="absolute right-4 top-4 z-20 w-64 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
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
    </aside>
  )
}
