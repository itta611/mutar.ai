import { atom } from "jotai"

export type EditorProjectStatus = "loading" | "ready" | "error"
export type ImageSize = [width: number, height: number]

export const editorProjectIdAtom = atom<string | null>(null)
export const editorProjectStatusAtom = atom<Record<string, EditorProjectStatus>>(
  {}
)
export const editorPmageSizeAtom = atom<Record<string, ImageSize>>({})
