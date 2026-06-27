"use client"

import Rive from "@rive-app/react-canvas"
import Image from "next/image"
import { useEffect, useState } from "react"

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

export function EditorLoader({ createdAt }: { createdAt: string | null }) {
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
    <div className="flex overflow-hidden bg-background dark:bg-muted h-full w-full rounded-2xl">
      <div className="w-1/2 h-full flex flex-col justify-center items-center">
        <div className="flex items-center justify-center gap-3">
          <Rive className="size-10 dark:invert" src="/loading.riv" />
          <div className="font-bold text-5xl leading-none tabular-nums">
            {remainingTime}
          </div>
        </div>
        <div className="text-center text-lg text-muted-foreground mt-4">
          {loadingMessage}
        </div>
      </div>
      <div className="w-1/2 h-full p-10 bg-linear-to-b flex justify-center flex-col items-center from-indigo-400/40 to-background dark:to-background">
        <Image
          alt=""
          className="object-contain"
          // src="/api/projects/b9984e2e-6df2-417b-b37c-b39089581f2e/image?kind=thumbnail"
          width={300}
          height={300}
        />
        <div className="text-center text-sm leading-tight text-muted-foreground mt-5">
          テキストテキスト
        </div>
      </div>
    </div>
  )
}
