export type SvgBox = {
  align?: "left" | "center" | "right"
  bbox: { x?: number; y?: number }[]
  bold?: boolean
  color?: string
  fontFamily?: "mincho" | "pop" | "gothic"
  fontSize: number
  lineheight?: number
  label: string
  wrapText?: boolean
}

type DetectedTextBox = {
  color?: string
  fontSize?: number
  lineheight?: number
  height?: number
  text?: string
  width?: number
  x?: number
  y?: number
}

export type SvgProject = {
  analysis: { boxes: Array<SvgBox | DetectedTextBox> }
  height: number
  width: number
}

export const fontFamilyMap: Record<
  NonNullable<SvgBox["fontFamily"]>,
  string
> = {
  gothic: '"Noto Sans JP", sans-serif',
  mincho: '"Noto Serif JP", serif',
  pop: '"M PLUS Rounded 1c", sans-serif',
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function scale(value: number, size: number) {
  return value >= 0 && value <= 1 ? value * size : value
}

function getBoxRect(box: SvgBox | DetectedTextBox, project: SvgProject) {
  if ("bbox" in box && Array.isArray(box.bbox)) {
    const xs = box.bbox.map((point) => point.x ?? 0)
    const ys = box.bbox.map((point) => point.y ?? 0)

    return {
      bottom: Math.max(...ys),
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
    }
  }

  const detectedBox = box as DetectedTextBox

  return {
    bottom: scale(
      (detectedBox.y ?? 0) + (detectedBox.height ?? 0),
      project.height
    ),
    left: scale(detectedBox.x ?? 0, project.width),
    right: scale(
      (detectedBox.x ?? 0) + (detectedBox.width ?? 0),
      project.width
    ),
    top: scale(detectedBox.y ?? 0, project.height),
  }
}

function textWidth(text: string, fontSize: number) {
  return Array.from(text).reduce(
    (width, char) => width + fontSize * (char.charCodeAt(0) <= 0x7f ? 0.55 : 1),
    0
  )
}

function wrapLine(line: string, maxWidth: number, fontSize: number) {
  const lines: string[] = []
  let current = ""

  for (const char of Array.from(line)) {
    const next = current + char

    if (current && textWidth(next, fontSize) > maxWidth) {
      lines.push(current)
      current = char
    } else {
      current = next
    }
  }

  return current ? [...lines, current] : lines
}

function createTextElement(box: SvgBox | DetectedTextBox, project: SvgProject) {
  const label = "label" in box ? box.label : box.text

  if (
    typeof label !== "string" ||
    !label ||
    ("bbox" in box && (!Array.isArray(box.bbox) || !box.bbox.length))
  ) {
    return ""
  }

  const rect = getBoxRect(box, project)
  const align = "align" in box ? (box.align ?? "center") : "left"
  const fontSize =
    typeof box.fontSize === "number" && Number.isFinite(box.fontSize)
      ? box.fontSize
      : 16
  const lineheight =
    typeof box.lineheight === "number" && Number.isFinite(box.lineheight)
      ? box.lineheight
      : 1.4
  const lineHeight = fontSize * lineheight
  const lines =
    "wrapText" in box && box.wrapText
      ? label
          .split("\n")
          .flatMap((line) => wrapLine(line, rect.right - rect.left, fontSize))
      : label.split("\n")
  const fontFamily =
    "fontFamily" in box && box.fontFamily && box.fontFamily in fontFamilyMap
      ? fontFamilyMap[box.fontFamily]
      : fontFamilyMap.gothic
  const color = typeof box.color === "string" ? box.color : "rgba(0,0,0,1)"
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

  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" fill="${escapeXml(color)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${"bold" in box && box.bold ? 700 : 400}" text-anchor="${textAnchor}" dominant-baseline="middle" xml:space="preserve">${escapeXml(line)}</text>`
    )
    .join("")
}

export function createProjectSvg({
  imageHref,
  project,
}: {
  imageHref: string
  project: SvgProject
}) {
  const boxes = Array.isArray(project.analysis?.boxes)
    ? project.analysis.boxes
    : []

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${project.width}" height="${project.height}" viewBox="0 0 ${project.width} ${project.height}"><image href="${escapeXml(imageHref)}" width="${project.width}" height="${project.height}" preserveAspectRatio="xMidYMid meet"/>${boxes
    .map((box) => createTextElement(box, project))
    .join("")}</svg>`
}
