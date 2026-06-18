"use client"

import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { SettingSection } from "./setting-section"

export function GeneralSettingsPage() {
  return (
    <div className="space-y-12">
      <div className="space-y-5">
        <h3 className="text-lg font-bold">表示</h3>
        <SettingSection title="言語">
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="言語を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </SettingSection>
        <SettingSection title="テーマ">
          <Select>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="テーマを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">システム</SelectItem>
              <SelectItem value="dark">ダーク</SelectItem>
              <SelectItem value="light">ライト</SelectItem>
            </SelectContent>
          </Select>
        </SettingSection>
      </div>
      <div className="space-y-5">
        <h3 className="text-lg font-bold">エディタ</h3>
        <SettingSection
          title="グリッドにスナップ"
          description="オブジェクトをグリッドにスナップします。"
          horizontal
        >
          <Switch />
        </SettingSection>
      </div>
    </div>
  )
}
