export type SvgBox = {
  align?: "left" | "center" | "right"
  bbox: { x?: number; y?: number }[]
  bold?: boolean
  color?: string
  fontFamily?: "mincho" | "pop" | "gothic"
  fontSize: number
  label: string
  wrapText?: boolean
}

export type SvgProject = {
  analysis: { boxes: SvgBox[] }
  height: number
  width: number
}

export const fontFamilyMap: Record<
  NonNullable<SvgBox["fontFamily"]>,
  string
> = {
  gothic: '"Hiragino Sans", "Yu Gothic", "YuGothic", sans-serif',
  mincho: '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif',
  pop: '"Hiragino Maru Gothic ProN", "Yu Gothic", "YuGothic", sans-serif',
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function getBoxRect(box: SvgBox) {
  const xs = box.bbox.map((point) => point.x ?? 0)
  const ys = box.bbox.map((point) => point.y ?? 0)

  return {
    bottom: Math.max(...ys),
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
  }
}

function createTextElement(box: SvgBox) {
  if (!box.bbox.length || !box.label) {
    return ""
  }

  const rect = getBoxRect(box)
  const align = box.align ?? "center"
  const lineHeight = box.fontSize * 1.4
  const lines = box.label.split("\n")
  const x =
    align === "left"
      ? rect.left
      : align === "right"
        ? rect.right
        : rect.left + (rect.right - rect.left) / 2
  const y =
    rect.top +
    (rect.bottom - rect.top) / 2 -
    ((lines.length - 1) * lineHeight) / 2
  const textAnchor =
    align === "left" ? "start" : align === "right" ? "end" : "middle"

  return `<text x="${x}" y="${y}" fill="${escapeXml(box.color ?? "rgba(0,0,0,1)")}" font-family="${escapeXml(fontFamilyMap[box.fontFamily ?? "gothic"])}" font-size="${box.fontSize}" font-weight="${box.bold ? 700 : 400}" text-anchor="${textAnchor}" dominant-baseline="middle" xml:space="preserve">${lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("")}</text>`
}

export function createProjectSvg({
  imageHref,
  project,
}: {
  imageHref: string
  project: SvgProject
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${project.width}" height="${project.height}" viewBox="0 0 ${project.width} ${project.height}"><image href="${escapeXml(imageHref)}" width="${project.width}" height="${project.height}" preserveAspectRatio="xMidYMid meet"/>${project.analysis.boxes
    .map(createTextElement)
    .join("")}</svg>`
}
