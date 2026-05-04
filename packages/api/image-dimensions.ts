export function getImageDimensions(bytes: Uint8Array, mediaType: string) {
  const fallback = { width: 1600, height: 1200 }

  if (mediaType === "image/png" && bytes.length > 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return {
      width: view.getUint32(16),
      height: view.getUint32(20),
    }
  }

  if (mediaType === "image/webp" && bytes.length > 30) {
    const signature = String.fromCharCode(...bytes.slice(12, 16))

    if (signature === "VP8X") {
      const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16))
      const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16))
      return { width, height }
    }
  }

  if (mediaType === "image/jpeg" || mediaType === "image/jpg") {
    let offset = 2

    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1
        continue
      }

      const marker = bytes[offset + 1]
      const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3

      if (isStartOfFrame) {
        const view = new DataView(
          bytes.buffer,
          bytes.byteOffset + offset,
          bytes.byteLength - offset
        )

        return {
          height: view.getUint16(5),
          width: view.getUint16(7),
        }
      }

      const length = (bytes[offset + 2] << 8) + bytes[offset + 3]
      offset += length + 2
    }
  }

  return fallback
}
