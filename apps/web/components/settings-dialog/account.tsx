"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"
import { SettingSection } from "./setting-section"
import { UsageCard } from "./usage-card"

type AccountFormValues = {
  name: string
}

export function AccountSettingsPage() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [error, setError] = useState("")
  const session = authClient.useSession()
  const user = session.data?.user
  const router = useRouter()
  const accountForm = useForm<AccountFormValues>({
    defaultValues: { name: "" },
  })

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
    toast.success("名前を変更しました。")
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
    <div className="space-y-12">
      <SettingSection title="名前">
        <form className="space-y-4" onSubmit={handleUpdateAccount}>
          <div className="max-w-90 flex gap-2">
            <Input {...accountForm.register("name")} />
            <Button disabled={isSavingName} type="submit">
              保存
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </SettingSection>
      <SettingSection title="メールアドレス" description={user?.email} />
      <SettingSection title="クレジット使用量">
        <UsageCard />
      </SettingSection>
      <SettingSection
        title="アカウント削除"
        description="アカウントと作成したプロジェクトを削除します。"
      >
        <Button onClick={() => setConfirmOpen(true)} variant="destructive">
          アカウントを削除
        </Button>
      </SettingSection>
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
    </div>
  )
}
