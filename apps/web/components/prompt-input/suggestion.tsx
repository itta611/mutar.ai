import { ComponentProps } from "react"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"

const SuggestionButton = ({
  className,
  ...props
}: ComponentProps<"button">) => {
  return (
    <Button
      size="sm"
      variant="outline"
      className={cn("rounded-full font-medium!", className)}
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
    <div className="mt-5">
      <div className="flex gap-2 sm:justify-center flex-wrap">
        <SuggestionButton
          onClick={() =>
            onSelect(`SaaSの料金プラン比較画像を作成。
3つのカードを横並びにして、「Starter」「Pro」「Business」と表示。
各カードに価格、主な機能、CTAボタンを配置。
モダンで見やすいWebデザイン風。`)
          }
        >
          SaaS料金プラン表
        </SuggestionButton>
        <SuggestionButton
          onClick={() =>
            onSelect(
              `企業の請求書処理を説明する業務フロー図の入った１枚のスライドを作成。
「受領」「OCR読み取り」「承認」「支払い」「保存」の5ステップを左から右に配置。各ステップに説明文を追加。
各ステップにアイコンを付け、スタイリッシュなデザイン。`
            )
          }
        >
          業務フロー図スライド
        </SuggestionButton>
        <SuggestionButton
          onClick={() =>
            onSelect(
              `カフェの春限定キャンペーン用ポスター案を作成。
メインコピーは「Spring Coffee Fair」。
サブコピーは「新しい季節に、新しい一杯を」。
桜、コーヒーカップ、明るい自然光を使った上品な広告風デザイン。`
            )
          }
        >
          カフェのキャンペーン用ポスター
        </SuggestionButton>
        <SuggestionButton
          onClick={() =>
            onSelect(
              `新発売の炭酸飲料のInstagram投稿用ビジュアルを作成。
商品名は「Citrus Spark」。
テキストは「はじける柑橘、夏の一口」。
オレンジ、レモン、炭酸の泡を使った爽やかな正方形デザイン。`
            )
          }
        >
          炭酸飲料のInstagram投稿用ビジュアル
        </SuggestionButton>
        <SuggestionButton
          onClick={() =>
            onSelect(
              `テックイベントの告知ポスターを作成。
イベント名は「AI Design Meetup 2026」。
日付は「2026.07.18」、場所は「Tokyo」。
黒背景にネオンブルーの光、近未来的でかっこいいデザイン。`
            )
          }
          className="not-sm:hidden"
        >
          テックイベントの告知ポスター
        </SuggestionButton>
        <SuggestionButton
          onClick={() =>
            onSelect(
              `スマホアプリのプロトタイプ紹介画像を作成。
アプリ名は「TaskPilot」。
キャッチコピーは「毎日のタスクを、もっと軽く」。
スマホ画面、チェックリスト、カレンダー、通知アイコンを含めた、SaaS風の広告ビジュアル。`
            )
          }
          className="not-sm:hidden"
        >
          スマホアプリの紹介画像
        </SuggestionButton>
      </div>
    </div>
  )
}
