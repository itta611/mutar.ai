"use client"

import { useAtom, useAtomValue } from "jotai"
import { AlignCenter, AlignLeft, AlignRight, TypeIcon } from "lucide-react"

import {
  type EditorBox,
  editorBoxesAtom,
  editorSaveBoxesAtom,
  editorSelectedBoxIndexesAtom,
} from "@/atom/generate"
import { ColorPickerWithInput } from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { resizeTextBox } from "@/hooks/editor-bbox"

const fonts = [
  { label: "ゴシック", value: "gothic" },
  { label: "明朝", value: "mincho" },
  { label: "丸ゴシック", value: "pop" },
] as const

type TextStylePatch = Partial<
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

function getCommonValue<T>(
  boxes: EditorBox[],
  getValue: (box: EditorBox) => T
): T | "" {
  const firstBox = boxes[0]

  if (!firstBox) {
    return ""
  }

  const firstValue = getValue(firstBox)

  return boxes.every((box) => getValue(box) === firstValue) ? firstValue : ""
}

function updateTextBox(
  boxes: EditorBox[],
  indexes: number[],
  patch: TextStylePatch
) {
  const selectedIndexes = new Set(indexes)

  return boxes.map((box, boxIndex) =>
    selectedIndexes.has(boxIndex)
      ? resizeTextBox({ ...box, ...patch }, box.label)
      : box
  )
}

export function Inspector() {
  const selectedIndexes = useAtomValue(editorSelectedBoxIndexesAtom)
  const saveBoxes = useAtomValue(editorSaveBoxesAtom)
  const [boxes, setBoxes] = useAtom(editorBoxesAtom)
  const selectedBoxes = selectedIndexes.flatMap((index) =>
    boxes[index] ? [boxes[index]] : []
  )
  const fontFamily = getCommonValue(
    selectedBoxes,
    (box) => box.fontFamily ?? "gothic"
  )
  const fontSize = getCommonValue(selectedBoxes, (box) => box.fontSize)
  const lineheight = getCommonValue(
    selectedBoxes,
    (box) => box.lineheight ?? 1.4
  )
  const letterSpacing = getCommonValue(
    selectedBoxes,
    (box) => box.letterSpacing ?? 0
  )
  const fontWeight = getCommonValue(selectedBoxes, (box) =>
    box.bold ? "bold" : "normal"
  )
  const align = getCommonValue(selectedBoxes, (box) => box.align ?? "center")
  const commonColor = getCommonValue(
    selectedBoxes,
    (box) => box.color ?? "#000000"
  )
  const color =
    commonColor === "" || commonColor.startsWith("#") ? commonColor : "#000000"

  function updateBox(patch: TextStylePatch, save = false) {
    if (selectedIndexes.length === 0) {
      return
    }

    setBoxes((current) => {
      const next = updateTextBox(current, selectedIndexes, patch)

      if (save) {
        saveBoxes?.(next)
      }

      return next
    })
  }

  function updateLabel(label: string) {
    const selectedIndex = selectedIndexes[0]

    if (selectedIndexes.length !== 1 || selectedIndex === undefined) {
      return
    }

    setBoxes((current) =>
      current.map((box, boxIndex) =>
        boxIndex === selectedIndex ? resizeTextBox(box, label) : box
      )
    )
  }

  return (
    <div className="hidden w-80 border-l border-border/70 bg-background px-5 py-3 md:block">
      <div className="mb-5 text-sm font-semibold">インスペクタ</div>
      {selectedBoxes.length > 0 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">テキスト</div>
            <Textarea
              onBlur={() => saveBoxes?.(boxes)}
              onChange={(event) => updateLabel(event.currentTarget.value)}
              value={
                selectedBoxes.length === 1
                  ? (selectedBoxes[0]?.label ?? "")
                  : ""
              }
              disabled={selectedBoxes.length !== 1}
              className="min-h-9 py-1.75"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">フォント</span>
            <Select
              items={fonts}
              onValueChange={(fontFamily) => {
                if (fontFamily) {
                  updateBox(
                    {
                      fontFamily: fontFamily as EditorBox["fontFamily"],
                    },
                    true
                  )
                }
              }}
              value={fontFamily}
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
            <span className="text-sm text-muted-foreground">文字サイズ</span>
            <Input
              className="w-27"
              min={1}
              onChange={(event) => {
                const fontSize = Number(event.currentTarget.value)

                if (Number.isFinite(fontSize) && fontSize > 0) {
                  updateBox({ fontSize })
                }
              }}
              onBlur={() => saveBoxes?.(boxes)}
              type="number"
              value={fontSize}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">行間</span>
            <Input
              className="w-27"
              min={0.1}
              onChange={(event) => {
                const lineheight = Number(event.currentTarget.value)

                if (Number.isFinite(lineheight) && lineheight > 0) {
                  updateBox({ lineheight })
                }
              }}
              onBlur={() => saveBoxes?.(boxes)}
              step={0.1}
              type="number"
              value={lineheight}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">字間</span>
            <Input
              className="w-27"
              onChange={(event) => {
                const letterSpacing = Number(event.currentTarget.value)

                if (Number.isFinite(letterSpacing)) {
                  updateBox({ letterSpacing })
                }
              }}
              onBlur={() => saveBoxes?.(boxes)}
              step={0.1}
              type="number"
              value={letterSpacing}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">字体</span>
            <Select
              items={[
                { label: "標準", value: "normal" },
                { label: "太字", value: "bold" },
              ]}
              onValueChange={(value) =>
                updateBox({ bold: value === "bold" }, true)
              }
              value={fontWeight}
            >
              <SelectTrigger className="min-w-27">
                <SelectValue
                  className={fontWeight === "bold" ? "font-bold" : undefined}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="normal">標準</SelectItem>
                  <SelectItem value="bold" className="font-bold">
                    太字
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">文字揃え</span>
            <Tabs
              onValueChange={(align) =>
                updateBox({ align: align as EditorBox["align"] }, true)
              }
              value={align}
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
            <span className="text-sm text-muted-foreground">文字色</span>
            <ColorPickerWithInput
              onValueChange={(color) => updateBox({ color })}
              onBlur={() => saveBoxes?.(boxes)}
              value={color}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 items-center justify-center pt-10 px-2">
          <div className="bg-muted size-10 rounded-sm flex items-center justify-center">
            <TypeIcon className="size-5" />
          </div>
          <div className="text-center space-y-2">
            <div className="font-bold text-[14px]">
              テキストを選択してください
            </div>
            <div className="text-center text-muted-foreground text-[13px]">
              テキストを選択するとフォントや文字サイズなどのスタイルを変更できます。
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
