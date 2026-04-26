import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

import { env } from "@/lib/env"

const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

function extensionFromMediaType(mediaType: string) {
  if (mediaType === "image/png") {
    return "png"
  }

  if (mediaType === "image/webp") {
    return "webp"
  }

  if (mediaType === "image/jpeg" || mediaType === "image/jpg") {
    return "jpg"
  }

  return "bin"
}

export async function uploadImageToR2(options: {
  keyPrefix: string
  bytes: Uint8Array
  mediaType: string
}) {
  const key = `${options.keyPrefix}.${extensionFromMediaType(options.mediaType)}`

  await client.send(
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: options.bytes,
      ContentType: options.mediaType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )

  return key
}

export async function readImageFromR2(key: string) {
  const response = await client.send(
    new GetObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    })
  )

  const bytes = await response.Body?.transformToByteArray()

  if (!bytes) {
    throw new Error(`R2 object not found for key ${key}`)
  }

  return {
    bytes,
    mediaType: response.ContentType ?? "application/octet-stream",
  }
}
