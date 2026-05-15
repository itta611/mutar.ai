import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3"
import nextEnv from "@next/env"
import { neon } from "@neondatabase/serverless"

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

const sql = neon(process.env.DATABASE_URL)

function extension(key) {
  return key.split(".").pop()
}

function nextKey(projectId, kind, key) {
  if (!key || key.startsWith(`projects/${projectId}/`)) {
    return null
  }

  if (key.startsWith(`projects/${projectId}/thumbnail/`)) {
    return `projects/${projectId}/thumbnail.${extension(key)}`
  }

  if (key.startsWith(`projects/${projectId}/${kind}.`)) {
    return null
  }

  const legacyPrefix = `${projectId}-${kind}.`

  if (key.startsWith(legacyPrefix)) {
    return `projects/${projectId}/${kind}.${extension(key)}`
  }

  const legacyProjectsPrefix = `projects/${projectId}-${kind}.`

  if (key.startsWith(legacyProjectsPrefix)) {
    return `projects/${projectId}/${kind}.${extension(key)}`
  }

  const currentPrefix = `${projectId}/${kind}.`

  if (key.startsWith(currentPrefix)) {
    return `projects/${projectId}/${kind}.${extension(key)}`
  }

  return null
}

function nextObjectKey(key) {
  const legacy = key.match(/^projects\/([^/]+)-(original|cleaned|thumbnail)\.([^.]+)$/)

  if (legacy) {
    return `projects/${legacy[1]}/${legacy[2]}.${legacy[3]}`
  }

  const current = key.match(/^([^/]+)\/(original|cleaned|thumbnail)\.([^.]+)$/)

  if (current) {
    return `projects/${current[1]}/${current[2]}.${current[3]}`
  }

  const thumbnail = key.match(/^projects\/([^/]+)\/thumbnail\/[^/]+\.([^.]+)$/)

  if (thumbnail) {
    return `projects/${thumbnail[1]}/thumbnail.${thumbnail[2]}`
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

const rows = await sql`
  select id, "originalImageKey", "cleanedImageKey", "thumbnailImageKey"
  from project
`

let moved = 0
let normalized = 0

for (const row of rows) {
  const originalImageKey = nextKey(row.id, "original", row.originalImageKey)
  const cleanedImageKey = nextKey(row.id, "cleaned", row.cleanedImageKey)
  const thumbnailImageKey = nextKey(row.id, "thumbnail", row.thumbnailImageKey)

  if (originalImageKey) {
    if (await ensureObject(row.originalImageKey, originalImageKey)) {
      await sql`
        update project
        set "originalImageKey" = ${originalImageKey}, "updatedAt" = now()
        where id = ${row.id}
      `
      await deleteObject(row.originalImageKey)
      moved += 1
    } else {
      await sql`
        update project
        set "originalImageKey" = ${originalImageKey}, "updatedAt" = now()
        where id = ${row.id}
      `
      normalized += 1
    }
  }

  if (cleanedImageKey) {
    if (await ensureObject(row.cleanedImageKey, cleanedImageKey)) {
      await sql`
        update project
        set "cleanedImageKey" = ${cleanedImageKey}, "updatedAt" = now()
        where id = ${row.id}
      `
      await deleteObject(row.cleanedImageKey)
      moved += 1
    } else {
      await sql`
        update project
        set "cleanedImageKey" = ${cleanedImageKey}, "updatedAt" = now()
        where id = ${row.id}
      `
      normalized += 1
    }
  }

  if (thumbnailImageKey) {
    if (await ensureObject(row.thumbnailImageKey, thumbnailImageKey)) {
      await sql`
        update project
        set "thumbnailImageKey" = ${thumbnailImageKey}, "updatedAt" = now()
        where id = ${row.id}
      `
      await deleteObject(row.thumbnailImageKey)
      moved += 1
    } else {
      await sql`
        update project
        set "thumbnailImageKey" = ${thumbnailImageKey}, "updatedAt" = now()
        where id = ${row.id}
      `
      normalized += 1
    }
  }
}

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
console.log(`Normalized ${normalized} missing DB keys`)
