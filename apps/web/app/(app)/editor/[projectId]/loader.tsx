"use client"

import Rive from "@rive-app/react-canvas"

export const editorLoaderSize = {
  height: 1098,
  width: 1454,
}

export function EditorLoader() {
  return (
    <svg
      aria-label="画像を生成しています"
      className="size-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`0 0 ${editorLoaderSize.width} ${editorLoaderSize.height}`}
    >
      <title></title>
      <defs>
        <linearGradient id="loading-preview-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#dfe7ff" />
          <stop offset="100%" stopColor="#ffffff" />
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

      <rect fill="#ffffff" height="1098" width="1454" />
      <path d="M727 0H21474V1098H727V0Z" fill="url(#loading-preview-bg)" />

      <foreignObject height="60" width="60" x="248" y="480">
        <Rive className="size-full" src="/loading.riv" />
      </foreignObject>
      <text fill="#030712" fontSize="72" fontWeight="700" x="330" y="538">
        3:20
      </text>
      <text
        fill="#6b7280"
        fontSize="28"
        fontWeight="400"
        textAnchor="middle"
        x="364"
        y="622"
      >
        画像を生成しています
      </text>

      <image
        filter="url(#loading-preview-shadow)"
        height="388"
        href={`/api/projects/376d6aee-826a-4a9f-8a93-501eb1a60b2c/image?kind=thumbnail`}
        preserveAspectRatio="xMidYMid meet"
        width="580"
        x="799"
        y="320"
      />
      <text
        fill="#6b7280"
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
