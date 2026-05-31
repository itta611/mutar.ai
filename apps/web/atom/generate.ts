import { atom } from "jotai"

export type EditorAspectRatio = "auto" | "16:9" | "4:3" | "3:4" | "1:1"
export type ImageSize = [width: number, height: number]
export type EditorBox = {
  align?: "left" | "center" | "right"
  bbox: { x?: number; y?: number }[]
  bold?: boolean
  color?: string
  fontFamily?: "mincho" | "pop" | "gothic"
  fontSize: number
  label: string
  letterSpacing?: number
  lineheight?: number
  wrapText?: boolean
}

export const fontFamilyMap: Record<
  NonNullable<EditorBox["fontFamily"]>,
  string
> = {
  gothic: '"Noto Sans JP", sans-serif',
  mincho: '"Noto Serif JP", serif',
  pop: '"M PLUS Rounded 1c", sans-serif',
}

export const editorProjectIdAtom = atom<string | null>(null)
export const editorProjectTitleAtom = atom<string>("")
export const editorImageSizeAtom = atom<ImageSize | null>(null)
export const editorBoxesAtom = atom<EditorBox[]>([])
export const editorSelectedBoxIndexAtom = atom<number | null>(null)
