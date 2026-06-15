"use client"

import { useAtom, useAtomValue } from "jotai"
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react"

import {
  editorBoxesAtom,
  editorSelectedBoxIndexAtom,
  type EditorBox,
} from "@/atom/generate"
import { ColorPickerWithInput } from "@/components/ui/color-picker"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { resizeTextBox } from "@/hooks/editor-bbox"

const fonts = [
  { label: "ゴシック", value: "gothic" },
  { label: "明朝", value: "mincho" },
  { label: "丸ゴシック", value: "pop" },
] as const

const fontWeights = [
  { label: "標準", value: "normal" },
  { label: "太字", value: "bold" },
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
    <div className="hidden w-80 border-l border-border/70 bg-background px-5 py-3 md:block">
      <div className="mb-7 text-sm font-semibold">インスペクタ</div>
      {box ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">フォント</span>
            <Select
              items={fonts}
              onValueChange={(fontFamily) => {
                if (fontFamily) {
                  updateBox({
                    fontFamily: fontFamily as EditorBox["fontFamily"],
                  })
                }
              }}
              value={box.fontFamily ?? "gothic"}
            >
              <SelectTrigger className="min-w-27">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {fonts.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">文字サイズ</span>
            <Input
              className="w-27"
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
            <span className="text-sm text-foreground">行間</span>
            <Input
              className="w-27"
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
              className="w-27"
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
            <span className="text-sm text-foreground">字体</span>
            <Select
              items={fontWeights}
              onValueChange={(value) => updateBox({ bold: value === "bold" })}
              value={box.bold ? "bold" : "normal"}
            >
              <SelectTrigger className="min-w-27">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {fontWeights.map((fontWeight) => (
                    <SelectItem key={fontWeight.value} value={fontWeight.value}>
                      {fontWeight.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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
            <span className="text-sm text-foreground">文字色</span>
            <ColorPickerWithInput
              onValueChange={(color) => updateBox({ color })}
              value={box.color?.startsWith("#") ? box.color : "#000000"}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">テキストを選択</p>
      )}
    </div>
  )
}
