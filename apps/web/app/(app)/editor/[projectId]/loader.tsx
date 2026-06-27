"use client"

import Rive from "@rive-app/react-canvas"
import { useEffect, useState } from "react"

export const editorLoaderSize = {
  height: 1098,
  width: 1454,
}

const countdownSeconds = 3.5 * 60

function getRemainingSeconds(createdAt: string | null, now: number) {
  if (!createdAt) {
    return countdownSeconds
  }

  const createdTime = new Date(createdAt).getTime()

  if (Number.isNaN(createdTime)) {
    return countdownSeconds
  }

  const elapsedSeconds = Math.floor((now - createdTime) / 1000)

  return Math.max(0, countdownSeconds - elapsedSeconds)
}

function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function EditorLoader({
  activeProjectId,
  createdAt,
}: {
  activeProjectId: string
  createdAt: string | null
}) {
  const [now, setNow] = useState(() => Date.now())
  const remainingSeconds = getRemainingSeconds(createdAt, now)
  const remainingTime = formatRemainingTime(remainingSeconds)
  const loadingMessage =
    remainingSeconds === 0 ? "お待たせしています..." : "画像を生成しています"

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <svg
      aria-label={loadingMessage}
      className="size-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`0 0 ${editorLoaderSize.width} ${editorLoaderSize.height}`}
    >
      <title>{loadingMessage}</title>
      <defs>
        <linearGradient id="loading-preview-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#dfe7ff" />
          <stop offset="100%" stopColor="var(--background)" />
        </linearGradient>
        <filter
          id="loading-preview-shadow"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="460"
          width="660"
          x="760"
          y="280"
        >
          <feDropShadow
            dx="0"
            dy="4"
            floodColor="#0f172a"
            floodOpacity="0.08"
            stdDeviation="14"
          />
        </filter>
      </defs>

      <rect
        className="fill-background dark:fill-muted"
        height="1098"
        width="1454"
      />
      <rect
        height={1098}
        width={727}
        x={727}
        y={0}
        fill="url(#loading-preview-bg)"
      />

      <foreignObject height="60" width="60" x="248" y="480">
        <Rive className="size-full" src="/loading.riv" />
      </foreignObject>
      <text
        fill="var(--foreground)"
        fontSize="72"
        fontWeight="700"
        x="330"
        y="538"
      >
        {remainingTime}
      </text>
      <text
        fill="var(--muted-foreground)"
        fontSize="28"
        fontWeight="400"
        textAnchor="middle"
        x="364"
        y="622"
      >
        {loadingMessage}
      </text>

      <image
        filter="url(#loading-preview-shadow)"
        height="388"
        href={`/api/projects/${activeProjectId}/image?kind=thumbnail`}
        preserveAspectRatio="xMidYMid meet"
        width="580"
        x="799"
        y="320"
      />
      <text
        fill="var(--muted-foreground)"
        fontSize="24"
        fontWeight="400"
        textAnchor="middle"
        x="1089"
        y="774"
      >
        生成中の画像は、完成後に自動で差し替わります
      </text>
    </svg>
  )
}
