"use client"

import { Input } from "@/components/ui/input"

export function Navbar() {
  return (
    <nav className="sticky bg-background top-0 left-0 right-0 h-13 shadow-sm flex justify-center items-center">
      <Input placeholder="検索..." className="w-[40%]" />
    </nav>
  )
}
