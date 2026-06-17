"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client"
import { authClient } from "@/lib/auth-client"

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
      <h2 className="mb-10 text-3xl font-medium">Account</h2>
      <form className="mb-5 bg-card p-5" onSubmit={handleUpdateAccount}>
        <div className="mb-4 text-base">名前</div>
        <div className="mb-4 max-w-90 flex gap-2">
          <Input {...accountForm.register("name")} />
          <Button disabled={isSavingName} type="submit">
            保存
          </Button>
        </div>
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      </form>
      <div className="bg-card p-5">
        <div className="mb-4 text-base">アカウント削除</div>
        <p className="mb-5 text-sm text-muted-foreground">
          アカウントと作成したプロジェクトを削除します。
        </p>
        <Button onClick={() => setConfirmOpen(true)} variant="destructive">
          アカウントを削除
        </Button>
      </div>
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
