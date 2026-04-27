import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [new URL('https://lh3.googleusercontent.com/**')],
  },
  turbopack: {
    root,
  },
}

export default nextConfig
