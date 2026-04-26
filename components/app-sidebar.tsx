"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Logo } from "./logo"
import { Avatar } from "./ui/avatar"
import { authClient } from "@/lib/auth-client"
import { ChevronDown } from "lucide-react"
import Image from "next/image"

export function AppSidebar() {
  const session = authClient.useSession()
  const user = session.data?.user

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo width={120} className="ml-2" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>一般</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                ホーム
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="border-t pt-1">
            <SidebarMenuButton className="h-14 gap-4">
              <Avatar size="lg" className="text-center font-bold flex justify-center items-center text-lg text-white bg-indigo-500">
                {user?.image ? <Image src={user?.image} alt="Avatar" fill /> : (user?.name || user?.email)?.[0].toUpperCase()}
              </Avatar>
              <div className="grow">
                <div className="font-semibold">{user?.name}</div>
                <div className="text-xs">{user?.email}</div></div>
              <ChevronDown className="text-neutral-500" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}