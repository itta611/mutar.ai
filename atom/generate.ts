import { atom } from "jotai"

export type GeneratedProjectImage = {
  height: number
  imageData: string
  width: number
}

export type ProjectGenerationStatus = "generating" | "ready" | "error"

export const projectGenerationStatusAtom = atom<
  Record<string, ProjectGenerationStatus>
>({})
export const generatedProjectImagesAtom = atom<
  Record<string, GeneratedProjectImage>
>({})
