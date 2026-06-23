"use client"

import { useQuery } from "@tanstack/react-query"
import {
  ChevronDown,
  HomeIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { ProjectDropdownMenu } from "@/components/gallary/project-dropdown-menu"
import { Logo } from "@/components/logo"
import { ProjectSearchDialog } from "@/components/project-search-dialog"
import { SettingsDialog } from "@/components/settings-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useUpdateProjectStarred } from "@/hooks/use-update-project-starred"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

async function listStarredProjects() {
  const response = await apiClient.projects.$get({
    query: { starred: "true" },
  })

  if (!response.ok) {
    throw new Error("request_failed")
  }

  const data = await response.json()

  return data.projects
}

export function AppSidebar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme } = useTheme()
  const session = authClient.useSession()
  const user = session.data?.user
  const { data: starredProjects = [] } = useQuery({
    queryKey: ["projects", "starred"],
    queryFn: listStarredProjects,
    enabled: !!user,
  })
  const updateProjectStarredMutation = useUpdateProjectStarred()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey || event.key.toLowerCase() !== "k") {
        return
      }

      event.preventDefault()
      setSearchOpen(true)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <Sidebar>
      <SidebarHeader className="h-13 py-0 gap-0">
        <div className="flex items-center h-full">
          <Link href="/home" className="ml-2">
            <Logo height={26} />
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
              <SidebarMenuButton onClick={() => setSearchOpen(true)}>
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
        <SidebarGroup>
          <SidebarGroupLabel>お気に入り</SidebarGroupLabel>
          <SidebarMenu>
            {starredProjects.length !== 0 &&
              starredProjects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    isActive={pathname === `/editor/${project.id}`}
                    render={<Link href={`/editor/${project.id}`} />}
                    className="justify-between pr-1"
                  >
                    {project.title}
                    <ProjectDropdownMenu
                      project={project}
                      onStarredChange={(project, isStarred) =>
                        updateProjectStarredMutation.mutate({
                          project,
                          isStarred,
                        })
                      }
                    />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem className="border-t pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="h-15 gap-3.5">
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
                <div className="text-muted-foreground relative flex cursor-default items-center gap-2 pl-2 p-1 text-sm">
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
                <div className="h-px bg-border my-1 mx-1" />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <SettingsIcon size={16} />
                  設定
                </DropdownMenuItem>
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
      <ProjectSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  )
}
