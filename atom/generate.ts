import { atom } from "jotai"

export type EditorProjectStatus = "loading" | "ready" | "error"
export type ImageSize = [width: number, height: number]
export type EditorBox = {
  bbox: { x?: number; y?: number }[]
  color?: string
  label: string
}

export const editorProjectIdAtom = atom<string | null>(null)
export const editorProjectStatusAtom = atom<EditorProjectStatus | null>(null)
export const editorImageSizeAtom = atom<ImageSize | null>(null)
export const editorBoxesAtom = atom<EditorBox[]>([])
