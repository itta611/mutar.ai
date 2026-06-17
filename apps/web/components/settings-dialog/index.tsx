"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const navItems = [
  { group: "Account", items: ["Preferences", "Account"] },
  { group: "Workspace", items: ["General", "Members", "Mentions", "Billing"] },
]

type SettingsTab = "Preferences" | "Account"

type AccountFormValues = {
  name: string
}

const settings = [
  {
    title: "Snap to grid",
    description:
      "Control how widgets align when moved. When on, widgets automatically align to grid. When off, widgets can be placed freely.",
    tip: "Tip: Hold ⌘ (Mac) or Ctrl (Windows) to move freely.",
  },
  {
    title: "Smart resizing",
    description:
      "Control how widgets align when resized. When on, neighbouring widgets automatically move to create a consistent layout. When off, neighbouring widgets stay in place.",
    tip: "Tip: Hold ⌘ (Mac) or Ctrl (Windows) to resize to grid.",
  },
]

async function getCreditUsage() {
  const response = await apiClient.credits.$get()

  if (!response.ok) {
    throw new Error("request_failed")
  }

  return response.json()
}

export function SettingsDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Preferences")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [error, setError] = useState("")
  const session = authClient.useSession()
  const user = session.data?.user
  const accountForm = useForm<AccountFormValues>({
    defaultValues: { name: "" },
  })
  const { data: creditUsage } = useQuery({
    queryKey: ["credit-usage"],
    queryFn: getCreditUsage,
    enabled: open,
  })
  const router = useRouter()
  const remainingCredits = creditUsage
    ? Math.max(0, creditUsage.quota - creditUsage.used)
    : 0
  const creditPercent = creditUsage
    ? Math.min(100, (remainingCredits / creditUsage.quota) * 100)
    : 0

  useEffect(() => {
    accountForm.reset({ name: user?.name ?? "" })
  }, [accountForm, user?.name])

  const handleUpdateAccount = accountForm.handleSubmit(async ({ name }) => {
    setIsSavingName(true)
    setError("")

    const response = await apiClient.account.$patch({
      json: { name },
    })

    setIsSavingName(false)

    if (!response.ok) {
      setError("名前を変更できませんでした。")
      return
    }

    router.refresh()
  })

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setError("")

    const result = await authClient.deleteUser({
      callbackURL: "/",
    })

    setIsDeleting(false)

    if (result.error) {
      setError("アカウントを削除できませんでした。")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="grid h-[min(760px,calc(100dvh-4rem))] max-w-250! grid-cols-1 gap-0 overflow-hidden p-0 sm:grid-cols-[240px_1fr]">
          <DialogTitle className="sr-only">設定</DialogTitle>
          <aside className="border-b bg-muted/40 p-4 sm:border-r sm:border-b-0">
            {navItems.map((group) => (
              <div className="mb-5" key={group.group}>
                <div className="mb-2 px-2 text-sm font-medium text-muted-foreground">
                  {group.group}
                </div>
                <div className="grid gap-1">
                  {group.items.map((item) => (
                    <button
                      type="button"
                      onClick={() => {
                        if (item === "Preferences" || item === "Account") {
                          setActiveTab(item)
                        }
                      }}
                      className={cn(
                        "h-9 rounded-md px-2 text-left text-sm",
                        item === activeTab && "bg-accent text-accent-foreground"
                      )}
                      key={item}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>
          <div className="overflow-y-auto p-6 sm:p-10">
            <h2 className="mb-10 text-3xl font-medium">{activeTab}</h2>
            {activeTab === "Preferences" ? (
              <>
                <h3 className="mb-5 text-2xl font-medium">Canvas</h3>
                <div className="overflow-hidden rounded-xl border bg-card">
                  {settings.map((setting) => (
                    <div
                      className="flex gap-6 border-b p-5 last:border-b-0"
                      key={setting.title}
                    >
                      <div className="grow">
                        <div className="mb-1 text-base">{setting.title}</div>
                        <p className="max-w-170 text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                        <div className="mt-3 inline-flex rounded-md border bg-background px-2 py-1 text-xs">
                          {setting.tip}
                        </div>
                      </div>
                      <Switch aria-label={setting.title} defaultChecked />
                    </div>
                  ))}
                </div>
                <h3 className="mt-10 mb-5 text-2xl font-medium">Credits</h3>
                <div className="mb-5 rounded-xl border bg-card p-5">
                  <div className="mb-2 text-base">残りクレジット</div>
                  <div className="text-sm text-muted-foreground">
                    基準日: 毎月{creditUsage?.resetDay ?? "-"}日
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-2 grow rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground"
                        style={{ width: `${creditPercent}%` }}
                      />
                    </div>
                    <div className="w-20 text-right text-sm text-muted-foreground">
                      {creditUsage
                        ? `${remainingCredits}/${creditUsage.quota}`
                        : "-"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <form
                  className="mb-5 bg-card p-5"
                  onSubmit={handleUpdateAccount}
                >
                  <div className="mb-4 text-base">名前</div>
                  <div className="mb-4 max-w-90 flex gap-2">
                    <Input {...accountForm.register("name")} />
                    <Button disabled={isSavingName} type="submit">
                      保存
                    </Button>
                  </div>
                  {error && (
                    <p className="mb-4 text-sm text-destructive">{error}</p>
                  )}
                </form>
                <div className="bg-card p-5">
                  <div className="mb-4 text-base">アカウント削除</div>
                  <p className="mb-5 text-sm text-muted-foreground">
                    アカウントと作成したプロジェクトを削除します。
                  </p>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    variant="destructive"
                  >
                    アカウントを削除
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-100!">
          <DialogTitle className="text-lg">
            アカウントを削除しますか？
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            この操作は取り消せません。
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              disabled={isDeleting}
              onClick={() => setConfirmOpen(false)}
              variant="outline"
            >
              キャンセル
            </Button>
            <Button
              disabled={isDeleting}
              onClick={handleDeleteAccount}
              variant="destructive"
            >
              削除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
