"use client"

import { atom, useAtom } from "jotai"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import type { EditorAspectRatio } from "@/atom/generate"
import {
  addImageFiles,
  type UploadedImage,
} from "@/components/prompt-input/file-upload"
import type { PromptStyle } from "@/components/prompt-input/style-select"
import { useAuthDialog } from "@/hooks/use-auth-dialog"
import {
  type GenerateProjectInput,
  useGenerateProject,
} from "@/hooks/use-generate-project"
import { authClient } from "@/lib/auth-client"

const promptSettingsCookieName = "prompt-settings"
const promptSettingsMaxAge = 60 * 60 * 24 * 365
const promptImagesAtom = atom<UploadedImage[]>([])
const defaultPromptSettings = {
  aspectRatio: "auto" as EditorAspectRatio,
  count: 2 as GenerateProjectInput["count"],
  style: { themeColor: "#6366F1" } satisfies PromptStyle,
}

function getPromptSettingsCookie() {
  if (typeof document === "undefined") {
    return null
  }

  const cookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${promptSettingsCookieName}=`))

  if (!cookie) {
    return null
  }

  try {
    return JSON.parse(decodeURIComponent(cookie.split("=")[1] ?? "")) as {
      aspectRatio?: EditorAspectRatio
      count?: GenerateProjectInput["count"]
      style?: PromptStyle
    }
  } catch {
    return null
  }
}

function setPromptSettingsCookie(settings: {
  aspectRatio: EditorAspectRatio
  count: GenerateProjectInput["count"]
  style: PromptStyle
}) {
  document.cookie = `${promptSettingsCookieName}=${encodeURIComponent(
    JSON.stringify(settings)
  )}; max-age=${promptSettingsMaxAge}; path=/; samesite=lax`
}

export function usePromptForm() {
  const initialSettings = getPromptSettingsCookie() ?? defaultPromptSettings
  const generateProject = useGenerateProject()
  const { openAuthDialog } = useAuthDialog()
  const router = useRouter()
  const session = authClient.useSession()
  const user = session.data?.user
  const form = useForm<{
    aspectRatio: EditorAspectRatio
    count: GenerateProjectInput["count"]
    prompt: string
  }>({
    defaultValues: {
      prompt: "",
      aspectRatio:
        initialSettings.aspectRatio ?? defaultPromptSettings.aspectRatio,
      count: initialSettings.count ?? defaultPromptSettings.count,
    },
  })
  const prompt = useWatch({ control: form.control, name: "prompt" })
  const aspect = useWatch({ control: form.control, name: "aspectRatio" })
  const count = useWatch({ control: form.control, name: "count" })
  const [style, setStyle] = useState<PromptStyle>(
    initialSettings.style ?? defaultPromptSettings.style
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [images, setImages] = useAtom(promptImagesAtom)
  const canGenerate =
    !isGenerating &&
    images.every((image) => image.dataUrl) &&
    (prompt.trim().length > 0 || images.length > 0)

  async function handleGenerate(
    options: Omit<GenerateProjectInput, "referenceImages">
  ) {
    if (!user) {
      openAuthDialog()
      return
    }

    setIsGenerating(true)

    try {
      const referenceImages = images.map((image) => image.dataUrl!)
      const projectId = await generateProject({
        ...options,
        referenceImages,
        style,
      })
      setImages([])
      router.push(`/editor/${projectId}`)
    } catch {
      toast.error("生成に失敗しました。")
      setIsGenerating(false)
    }
  }

  async function attachProjectImage(project: { id: string; title: string }) {
    const response = await fetch(
      `/api/projects/${project.id}/image?kind=original`
    )

    if (!response.ok) {
      toast.error("添付に失敗しました。")
      return
    }

    const blob = await response.blob()
    const file = new File([blob], `${project.title}.png`, {
      lastModified: 0,
      type: blob.type,
    })

    addImageFiles([file], images, setImages)
  }

  useEffect(() => {
    setPromptSettingsCookie({ aspectRatio: aspect, count, style })
  }, [aspect, count, style])

  return {
    aspect,
    attachProjectImage,
    canGenerate,
    count,
    form,
    handleGenerate,
    images,
    isGenerating,
    setAspect: (aspect: EditorAspectRatio) =>
      form.setValue("aspectRatio", aspect),
    setCount: (count: number) =>
      form.setValue("count", count as GenerateProjectInput["count"]),
    setImages,
    setPrompt: (prompt: string) => form.setValue("prompt", prompt),
    setStyle,
    style,
  }
}
