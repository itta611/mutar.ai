import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import nextEnv from "@next/env"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const { loadEnvConfig } = nextEnv

loadEnvConfig(root)

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
  },
  transpilePackages: ["@hengen/api", "@hengen/db", "@hengen/email"],
  turbopack: {
    root,
  },
}

export default nextConfig
