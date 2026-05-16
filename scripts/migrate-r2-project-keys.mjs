import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3"
import nextEnv from "@next/env"

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())

const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME

if (!bucket) {
  throw new Error("CLOUDFLARE_R2_BUCKET_NAME is required")
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

function nextObjectKey(key) {
  const normalized = key.match(/^projects\/([^/]+)\/(original|cleaned|thumbnail)\.png$/)

  if (normalized) {
    return null
  }

  const nested = key.match(/^projects\/([^/]+)\/(original|cleaned|thumbnail)\.[^.]+$/)

  if (nested) {
    return `projects/${nested[1]}/${nested[2]}.png`
  }

  const legacy = key.match(/^projects\/([^/]+)-(original|cleaned|thumbnail)\.[^.]+$/)

  if (legacy) {
    return `projects/${legacy[1]}/${legacy[2]}.png`
  }

  const current = key.match(/^([^/]+)\/(original|cleaned|thumbnail)\.[^.]+$/)

  if (current) {
    return `projects/${current[1]}/${current[2]}.png`
  }

  const thumbnail = key.match(/^projects\/([^/]+)\/thumbnail\/[^/]+\.[^.]+$/)

  if (thumbnail) {
    return `projects/${thumbnail[1]}/thumbnail.png`
  }

  return null
}

function copySource(key) {
  return `${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`
}

async function copyObject(fromKey, toKey) {
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: toKey,
      CopySource: copySource(fromKey),
    })
  )
}

async function objectExists(key) {
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

async function deleteObject(key) {
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )
}

async function ensureObject(fromKey, toKey) {
  if (await objectExists(toKey)) {
    return true
  }

  if (!(await objectExists(fromKey))) {
    console.warn(`Missing ${fromKey}`)
    return false
  }

  await copyObject(fromKey, toKey)
  return true
}

let moved = 0

let token

do {
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: token,
    })
  )

  for (const object of response.Contents ?? []) {
    const key = object.Key
    const next = key ? nextObjectKey(key) : null

    if (!key || !next) {
      continue
    }

    if (await ensureObject(key, next)) {
      await deleteObject(key)
      moved += 1
    }
  }

  token = response.NextContinuationToken
} while (token)

console.log(`Moved ${moved} R2 objects`)
