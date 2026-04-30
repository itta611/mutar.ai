import { atom } from "jotai"

export type EditorProjectStatus = "loading" | "generating" | "ready" | "error"
export type ImageSize = [width: number, height: number]

export const editorProjectIdAtom = atom<string | null>(null)
export const editorProjectStatusAtom = atom<EditorProjectStatus | null>(null)
export const editorImageSizeAtom = atom<ImageSize | null>(null)
