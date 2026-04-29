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
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function AppSidebar() {
  const router = useRouter()
  const session = authClient.useSession()
  const user = session.data?.user

  return (
    <Sidebar className="border-none">
      <SidebarHeader className="flex h-13 justify-center">
        <Link href="/" className="ml-2">
          <Logo width={120} />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>一般</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>ホーム</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="border-t pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="h-15 gap-4">
                    {!user ? (
                      <Skeleton className="h-10 w-10 rounded-full" />
                    ) : (
                      <Avatar
                        size="lg"
                        className="flex items-center justify-center bg-indigo-500 text-center text-lg font-bold text-white"
                      >
                        {user?.image && (
                          <AvatarImage src={user?.image} alt="Avatar" />
                        )}
                        <AvatarFallback>
                          {(user?.name || user?.email)?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex h-10 grow flex-col justify-center gap-0.5">
                      <div className="font-semibold">
                        {user ? (
                          user.name
                        ) : (
                          <Skeleton className="mb-1.5 h-4 w-12" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user ? user.email : <Skeleton className="h-3 w-24" />}
                      </div>
                    </div>
                    <ChevronDown className="text-zinc-500" />
                  </SidebarMenuButton>
                }
              ></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={async () => {
                    await authClient.signOut()
                    router.push("/")
                  }}
                >
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
