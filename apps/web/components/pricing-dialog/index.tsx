"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

type PricingDialogContextValue = {
  close: () => void
  isOpen: boolean
  open: () => void
  setOpen: (open: boolean) => void
}

const PricingDialogContext = createContext<PricingDialogContextValue | null>(
  null
)

function PricingDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)

  const open = useCallback(() => {
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      close,
      isOpen,
      open,
      setOpen,
    }),
    [close, isOpen, open]
  )

  return (
    <PricingDialogContext.Provider value={value}>
      {children}
      <PricingDialog />
    </PricingDialogContext.Provider>
  )
}

function usePricingDialog() {
  const context = useContext(PricingDialogContext)

  if (!context) {
    throw new Error(
      "usePricingDialog must be used within PricingDialogProvider"
    )
  }

  return context
}

function PricingDialog() {
  const { isOpen, setOpen } = usePricingDialog()

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[680px]! w-[90%] gap-0 overflow-y-auto rounded-3xl p-8!">
        <div className="space-y-3">
          <DialogTitle className="text-2xl font-bold tracking-normal">
            プランをアップグレード
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600">
            プランを選択してください。
          </DialogDescription>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <PlanCard
            name="ベーシック"
            price="3000"
            features={[
              "月あたり300クレジット付与",
              "画像編集機能",
              "画像編集機能",
              "商用利用可能",
            ]}
          />
          <PlanCard
            name="プレミアム"
            price="9000"
            features={[
              "月あたり900クレジット付与",
              "画像編集機能",
              "画像編集機能",
              "商用利用可能",
            ]}
          />
        </div>

        <div className="mt-6 text-center">
          <a
            className="text-sm text-slate-400 underline underline-offset-4 transition-colors hover:text-slate-600"
            href="/specified"
          >
            特定商取引に関する表示
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PlanCard({
  name,
  price,
  features,
}: {
  name: string
  price: string
  features: string[]
}) {
  return (
    <div className="rounded-3xl border-[8px] border-indigo-50/80 bg-white p-4 shadow-lg/5">
      <div className="text-lg font-bold text-indigo-500">{name}</div>
      <div>
        <span className="text-3xl font-bold mr-1 font-[ui-sans-serif,_system-ui,_sans-serif]">
          ¥
        </span>
        <span className="text-4xl font-bold mr-1 tracking-tight font-[ui-sans-serif,_system-ui,_sans-serif]">
          {price}
        </span>
        <span className="text-lg text-slate-500">/月</span>
      </div>

      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li
            className="flex items-center gap-2 text-base font-medium text-slate-600 sm:text-lg"
            key={feature}
          >
            <CheckIcon className="size-6 shrink-0 text-indigo-500" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        size="lg"
        className="w-full shadow shadow-indigo-500/10 mt-4"
      >
        {name}プランを開始
      </Button>
    </div>
  )
}

export { PricingDialogProvider, usePricingDialog }
