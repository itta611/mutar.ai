import { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import {
  BriefcaseBusinessIcon,
  DollarSignIcon,
  FileImageIcon,
} from "lucide-react"

const SuggestionButton = ({
  className,
  ...props
}: ComponentProps<"button">) => {
  return (
    <button
      className={cn(
        "transition cursor-pointer text-sm text-muted-foreground h-10 gap-2 rounded-lg px-5 flex items-center bg-zinc-50 hover:bg-zinc-100 active:scale-98 dark:bg-zinc-800 dark:hover:bg-zinc-700",
        className
      )}
      {...props}
    />
  )
}

export function Suggestion({
  onSelect,
}: {
  onSelect: (content: string) => void
}) {
  return (
    <div className="mt-7">
      <div className="flex gap-2 sm:justify-center flex-wrap">
        <SuggestionButton
          onClick={() =>
            onSelect(`SaaSの料金プラン比較画像を作成。
3つのカードを横並びにして、「Starter」「Pro」「Business」と表示。
各カードに価格、主な機能、CTAボタンを配置。
一つのテーマカラーで統一されたモダンで見やすいWebデザイン風。`)
          }
        >
          <DollarSignIcon className="w-4 h-4" />
          SaaS料金プラン表
        </SuggestionButton>
        <SuggestionButton
          onClick={() =>
            onSelect(
              `企業の請求書処理を説明する業務フロー図の入った１枚のスライドを作成。
「受領」「OCR読み取り」「承認」「支払い」「保存」の5ステップを左から右に配置。各ステップに説明文を追加。
各ステップにアイコンを付け、一つのテーマカラーで統一されたスタイリッシュなデザイン。`
            )
          }
        >
          <BriefcaseBusinessIcon className="w-4 h-4" />
          業務フロー説明スライド資料
        </SuggestionButton>
        <SuggestionButton
          onClick={() =>
            onSelect(
              `採用広報やイベント告知にも使えるブランドポスターを作成。
大きなキャッチコピーを主役にし、サブコピー、開催情報またはサービス名、短い紹介文を整理して配置。
写真を使わず、タイポグラフィと図形表現を中心に構成する。
モダンで感度の高いデザインにし、スタートアップらしい世界観が伝わるビジュアルにする。`
            )
          }
        >
          <FileImageIcon className="w-4 h-4" />
          ブランドポスター
        </SuggestionButton>
      </div>
    </div>
  )
}
