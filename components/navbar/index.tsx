"use client"

import { Input } from "@/components/ui/input"

export function Navbar() {
  return (
    <nav className="sticky top-0 right-0 left-0 flex h-13 items-center justify-center bg-background">
      <Input placeholder="検索..." className="w-[40%]" />
    </nav>
  )
}
