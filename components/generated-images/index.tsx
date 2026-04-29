"use client"

import { EllipsisIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAtom } from "jotai"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { generatedImageIdsAtom } from "./atoms"
import { Button } from "../ui/button"

export function GeneratedImages() {
  const [images, setImages] = useAtom(generatedImageIdsAtom)

  function deleteImage(id: string) {
    setImages((images) => images.filter((image) => image !== id))
    fetch(`/api/projects/${id}`, { method: "DELETE" })
  }

  return (
    <div className="grid grid-cols-2 gap-x-7 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
      {images.map((image) => (
        <div key={image} className="active:scale-99 transition duration-75">
          <Link href={`/editor/${image}`} className="block">
            <Image
              src={`/api/projects/${image}/image?variant=original`}
              alt=""
              width={300}
              height={300}
              unoptimized
              className="aspect-[16/9] w-full object-cover border rounded-t-xl"
            />
            <div className="flex items-center justify-between px-4 py-2.5 rounded-b-xl bg-accent">
              <span className="text-sm">タイトル</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      type="button"
                      className="text-muted-foreground"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                      }}
                    >
                      <EllipsisIcon className="size-4.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => deleteImage(image)}
                  >
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
