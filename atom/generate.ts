import { atom } from "jotai"

export type EditorProjectStatus =
  | "generating"
  | "analyzing"
  | "erasing"
  | "ready"
  | "error"
  | "none"
export type EditorAspectRatio = "16:9" | "4:3" | "3:4" | "1:1"
export type ImageSize = [width: number, height: number]
export type EditorBox = {
  align?: "left" | "center" | "right"
  bbox: { x?: number; y?: number }[]
  color?: string
  label: string
}

export const editorProjectIdAtom = atom<string | null>(null)
export const editorProjectStatusAtom = atom<EditorProjectStatus>("none")
export const editorImageSizeAtom = atom<ImageSize | null>(null)
export const editorBoxesAtom = atom<EditorBox[]>([])
