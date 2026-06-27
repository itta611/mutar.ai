"use client"

import { type EditorBox, fontFamilyMap, type ImageSize } from "@/atom/generate"

function getTextWidth(
  context: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number
) {
  return (
    context.measureText(text).width + Array.from(text).length * letterSpacing
  )
}

function fillText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number
) {
  if (letterSpacing === 0) {
    context.fillText(text, x, y)
    return
  }

  const chars = Array.from(text)
  const width = getTextWidth(context, text, letterSpacing)
  const textAlign = context.textAlign
  let currentX =
    textAlign === "right"
      ? x - width
      : textAlign === "center"
        ? x - width / 2
        : x

  context.textAlign = "left"
  for (const char of chars) {
    context.fillText(char, currentX, y)
    currentX += context.measureText(char).width + letterSpacing
  }
  context.textAlign = textAlign
}

function getBoxRect(box: EditorBox) {
  const xs = box.bbox.map((point) => point.x ?? 0)
  const ys = box.bbox.map((point) => point.y ?? 0)
  const left = Math.min(...xs)
  const top = Math.min(...ys)

  return {
    height: Math.max(...ys) - top,
    left,
    top,
    width: Math.max(...xs) - left,
  }
}

function getTextLines(
  context: CanvasRenderingContext2D,
  box: EditorBox,
  boxWidth: number
) {
  const letterSpacing = box.letterSpacing ?? 0

  return box.wrapText
    ? box.label.split("\n").flatMap((line) => {
        const wrappedLines: string[] = []
        let currentLine = ""

        for (const char of Array.from(line)) {
          const nextLine = currentLine + char

          if (
            currentLine &&
            getTextWidth(context, nextLine, letterSpacing) > boxWidth
          ) {
            wrappedLines.push(currentLine)
            currentLine = char
          } else {
            currentLine = nextLine
          }
        }

        return currentLine ? [...wrappedLines, currentLine] : wrappedLines
      })
    : box.label.split("\n")
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function getAlphabeticBaselineY(
  context: CanvasRenderingContext2D,
  text: string,
  centerY: number,
  fontSize: number
) {
  const metrics = context.measureText(text || "M")
  const ascent =
    metrics.actualBoundingBoxAscent || metrics.fontBoundingBoxAscent || fontSize
  const descent =
    metrics.actualBoundingBoxDescent || metrics.fontBoundingBoxDescent || 0

  return centerY + (ascent - descent) / 2
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("blob_unavailable"))
      }
    }, "image/png")
  })
}

async function loadImage(src: string) {
  const image = new Image()
  image.decoding = "async"
  image.src = src
  await image.decode()
  return image
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export function useExport({
  boxes,
  imageSize,
  projectId,
  projectName,
}: {
  boxes: EditorBox[]
  imageSize: ImageSize | null
  projectId: string | undefined
  projectName: string
}) {
  async function exportPngBlob() {
    if (!projectId || !imageSize) {
      throw new Error("project_not_ready")
    }

    const image = await loadImage(`/api/projects/${projectId}/image`)
    const [width, height] = imageSize
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("canvas_unavailable")
    }

    context.drawImage(image, 0, 0, width, height)

    for (const box of boxes) {
      const rect = getBoxRect(box)
      const fontSize = box.fontSize
      const letterSpacing = box.letterSpacing ?? 0
      const lineheight = box.lineheight ?? 1.4
      const lineHeight = fontSize * lineheight
      const fontFamily = fontFamilyMap[box.fontFamily ?? "gothic"]

      context.font = `${box.bold ? 700 : 400} ${fontSize}px ${fontFamily}`

      const lines = getTextLines(context, box, rect.width)
      const align = box.align ?? "center"
      const x =
        align === "left"
          ? rect.left
          : align === "right"
            ? rect.left + rect.width
            : rect.left + rect.width / 2
      const y =
        rect.top + rect.height / 2 - ((lines.length - 1) * lineHeight) / 2

      context.fillStyle = box.color ?? "rgba(0,0,0,1)"
      context.textAlign = align
      context.textBaseline = "middle"

      lines.forEach((line, index) => {
        fillText(context, line, x, y + index * lineHeight, letterSpacing)
      })
    }

    return canvasToBlob(canvas)
  }

  async function exportSvgText() {
    if (!projectId || !imageSize) {
      throw new Error("project_not_ready")
    }

    const [width, height] = imageSize
    const imageBlob = await fetch(`/api/projects/${projectId}/image`).then(
      (response) => response.blob()
    )
    const imageDataUrl = await blobToDataUrl(imageBlob)
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("canvas_unavailable")
    }

    const texts = boxes.map((box) => {
      const rect = getBoxRect(box)
      const fontSize = box.fontSize
      const lineheight = box.lineheight ?? 1.4
      const lineHeight = fontSize * lineheight
      const fontFamily = fontFamilyMap[box.fontFamily ?? "gothic"]
      const align = box.align ?? "center"
      const x =
        align === "left"
          ? rect.left
          : align === "right"
            ? rect.left + rect.width
            : rect.left + rect.width / 2
      const textAnchor =
        align === "left" ? "start" : align === "right" ? "end" : "middle"

      context.font = `${box.bold ? 700 : 400} ${fontSize}px ${fontFamily}`
      const lines = getTextLines(context, box, rect.width)
      const firstLineCenterY =
        rect.top + rect.height / 2 - ((lines.length - 1) * lineHeight) / 2

      return `<text fill="${escapeXml(
        box.color ?? "rgba(0,0,0,1)"
      )}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${box.bold ? 700 : 400}" letter-spacing="${box.letterSpacing ?? 0}" text-anchor="${textAnchor}" xml:space="preserve">${lines
        .map(
          (line, index) =>
            `<tspan x="${x}" y="${getAlphabeticBaselineY(
              context,
              line,
              firstLineCenterY + index * lineHeight,
              fontSize
            )}">${escapeXml(line)}</tspan>`
        )
        .join("")}</text>`
    })

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image href="${imageDataUrl}" width="${width}" height="${height}"/>${texts.join("")}</svg>`
  }

  return {
    copyPng: async () => {
      const blob = await exportPngBlob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
    },
    copySvg: async () => {
      const svg = await exportSvgText()
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([svg], { type: "text/html" }),
          "text/plain": new Blob([svg], { type: "text/plain" }),
        }),
      ])
    },
    downloadPng: async () => {
      const blob = await exportPngBlob()
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${projectName || "image"}.png`
      link.click()
      URL.revokeObjectURL(link.href)
    },
  }
}
