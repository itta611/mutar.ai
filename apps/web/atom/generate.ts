import { atom } from "jotai"
import type { SvgBox } from "@hengen/svg-renderer"

export type EditorAspectRatio = "auto" | "16:9" | "4:3" | "3:4" | "1:1"
export type ImageSize = [width: number, height: number]
export type EditorBox = SvgBox

export const editorProjectIdAtom = atom<string | null>(null)
export const editorImageSizeAtom = atom<ImageSize | null>(null)
export const editorBoxesAtom = atom<EditorBox[]>([])
