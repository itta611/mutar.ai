export const editorFonts = [
  {
    label: "Manrope",
    value: "Manrope",
    cssVariable: "var(--font-editor-sans)",
  },
  {
    label: "Cormorant Garamond",
    value: "Cormorant Garamond",
    cssVariable: "var(--font-editor-display)",
  },
  {
    label: "IBM Plex Sans",
    value: "IBM Plex Sans",
    cssVariable: "var(--font-editor-plex)",
  },
  {
    label: "Source Serif 4",
    value: "Source Serif 4",
    cssVariable: "var(--font-editor-serif)",
  },
] as const

export type EditorFontName = (typeof editorFonts)[number]["value"]

export function isEditorFontName(value: string): value is EditorFontName {
  return editorFonts.some(
    (font) => font.value === value || font.cssVariable === value
  )
}

export function normalizeEditorFont(value: string): EditorFontName {
  return (
    editorFonts.find(
      (font) => font.value === value || font.cssVariable === value
    )?.value ?? editorFonts[0].value
  )
}

export function resolveEditorFontFamily(value: string) {
  return editorFonts.find((font) => font.value === value)?.cssVariable ?? value
}
