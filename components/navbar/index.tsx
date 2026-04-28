"use client"

import { Input } from "@/components/ui/input"

export function Navbar() {
  return (
    <nav className="h-13 shadow-sm flex justify-center items-center">
      <Input placeholder="検索..." className="w-[40%]" />
    </nav>
  )
}
