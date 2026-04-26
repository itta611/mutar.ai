"use client"

import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"
import { EditorContent, useEditor } from "@tiptap/react"
import { GripVertical } from "lucide-react"
import { useEffect } from "react"

import { resolveEditorFontFamily } from "@/lib/fonts"
import { cn } from "@/lib/utils"

type TextLayerProps = {
  id: string
  content: string
  x: number
  y: number
  width: number
  height: number
  canvasWidth: number
  canvasHeight: number
  fontFamily: string
  fontSize: number
  color: string
  selected: boolean
  onSelect: (id: string) => void
  onContentChange: (id: string, content: string) => void
  onStartDrag: (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string
  ) => void
}

function normaliseInitialContent(content: string) {
  if (content.includes("<")) {
    return content
  }

  return `<p>${content}</p>`
}

export function TextLayer(props: TextLayerProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        orderedList: false,
      }),
      Placeholder.configure({
        placeholder: "文字を入力",
      }),
    ],
    content: normaliseInitialContent(props.content),
    editorProps: {
      attributes: {
        class: "h-full outline-none",
      },
    },
    onFocus: () => {
      props.onSelect(props.id)
    },
    onUpdate: ({ editor: currentEditor }) => {
      props.onContentChange(props.id, currentEditor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    const nextContent = normaliseInitialContent(props.content)

    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false })
    }
  }, [editor, props.content])

  return (
    <div
      className={cn(
        "group/text-layer absolute rounded-md transition",
        props.selected
          ? "bg-background/85 shadow-sm ring-2 ring-ring"
          : "bg-transparent ring-1 ring-transparent hover:ring-ring/40"
      )}
      style={{
        left: props.x * props.canvasWidth,
        top: props.y * props.canvasHeight,
        width: props.width * props.canvasWidth,
        height: props.height * props.canvasHeight,
        color: props.color,
        fontSize: props.fontSize,
        fontFamily: resolveEditorFontFamily(props.fontFamily),
      }}
      onPointerDown={() => props.onSelect(props.id)}
    >
      <button
        type="button"
        className={cn(
          "absolute -top-3 -right-3 z-10 flex size-7 cursor-grab items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition active:cursor-grabbing",
          props.selected
            ? "opacity-100"
            : "pointer-events-none opacity-0 group-hover/text-layer:pointer-events-auto group-hover/text-layer:opacity-100"
        )}
        onPointerDown={(event) => props.onStartDrag(event, props.id)}
        aria-label="Move text box"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>

      <div className="tiptap-layer h-full overflow-hidden rounded-md px-2 py-1 leading-tight [overflow-wrap:normal] [word-break:keep-all]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
