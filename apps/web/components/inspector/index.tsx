"use client"

import { useAtom, useAtomValue } from "jotai"
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react"

import {
  editorBoxesAtom,
  editorSelectedBoxIndexAtom,
  type EditorBox,
} from "@/atom/generate"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      | "align"
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
        | "align"
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
    <div className="hidden w-80 border-l border-border/70` bg-background px-5 py-3 md:block">
      <div className="mb-7 text-sm font-semibold">インスペクタ</div>
      {box ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">フォント</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    className="min-w-28 justify-between bg-muted/50"
                    size="sm"
                    type="button"
                    variant="ghost"
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
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">文字サイズ</span>
            <Input
              className="w-24 bg-muted/50 text-center"
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
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">文字揃え</span>
            <Tabs
              onValueChange={(align) =>
                updateBox({ align: align as EditorBox["align"] })
              }
              value={box.align ?? "center"}
            >
              <TabsList>
                <TabsTrigger aria-label="左揃え" value="left">
                  <AlignLeft />
                </TabsTrigger>
                <TabsTrigger aria-label="中央揃え" value="center">
                  <AlignCenter />
                </TabsTrigger>
                <TabsTrigger aria-label="右揃え" value="right">
                  <AlignRight />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">行間</span>
            <Input
              className="w-24 bg-muted/50 text-center"
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
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">字間</span>
            <Input
              className="w-24 bg-muted/50 text-center"
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
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">フォントカラー</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label="フォントカラー"
                    className="border-border"
                    size="icon-sm"
                    style={{
                      backgroundColor: box.color?.startsWith("#")
                        ? box.color
                        : "#000000",
                    }}
                    type="button"
                    variant="outline"
                  />
                }
              />
              <DropdownMenuContent className="w-auto p-0">
                <ColorPicker
                  onValueChange={(color) => updateBox({ color })}
                  value={box.color?.startsWith("#") ? box.color : "#000000"}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">太字</span>
            <Button
              aria-pressed={box.bold ?? false}
              className="min-w-20"
              onClick={() => updateBox({ bold: !(box.bold ?? false) })}
              size="sm"
              type="button"
              variant={box.bold ? "secondary" : "ghost"}
            >
              {box.bold ? "オン" : "オフ"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">テキストを選択</p>
      )}
    </div>
  )
}
