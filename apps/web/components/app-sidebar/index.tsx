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
import {
  ChevronDown,
  HomeIcon,
  LogOutIcon,
  Monitor,
  MonitorIcon,
  Moon,
  MoonIcon,
  PaletteIcon,
  SearchIcon,
  StarIcon,
  Sun,
  SunIcon,
  Trash2Icon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const session = authClient.useSession()
  const user = session.data?.user

  return (
    <Sidebar className="border-r border-border/70">
      <SidebarHeader className="h-13 py-0 gap-0">
        <div className="flex items-center h-full">
          <Link href="/" className="ml-2">
            <Logo width={120} />
          </Link>
        </div>
        <div className="h-px mx-1 bg-border/70" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>一般</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/home"}
                render={<Link href="/home" />}
              >
                <HomeIcon />
                ホーム
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <SearchIcon />
                検索
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/starred"}
                render={<Link href="/starred" />}
              >
                <StarIcon />
                お気に入り
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/trash"}
                render={<Link href="/trash" />}
              >
                <Trash2Icon />
                ゴミ箱
              </SidebarMenuButton>
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
              />
              <DropdownMenuContent>
                <div className="text-muted-foreground relative flex cursor-default items-center gap-2 pl-2 text-sm h-9">
                  <PaletteIcon size={16} />
                  <div className="grow">テーマ</div>
                  <Tabs onValueChange={(value) => setTheme(value)}>
                    <TabsList>
                      <TabsTrigger value="system">
                        <MonitorIcon />
                      </TabsTrigger>
                      <TabsTrigger value="dark">
                        <MoonIcon />
                      </TabsTrigger>
                      <TabsTrigger value="light">
                        <SunIcon />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <DropdownMenuItem
                  onClick={async () => {
                    await authClient.signOut()
                    router.push("/")
                  }}
                >
                  <LogOutIcon size={16} />
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
