import LogoIcon from "@/components/logo-icon"

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr,1fr] justify-between w-full">
      <div className="font-bold mb-2 mt-8 text-lg">{label}</div>
      <div>{children}</div>
    </div>
  )
}

export default async function Page() {
  return (
    <div>
      <div className="min-h-full pb-10 sm:px-10 px-5">
        <div className="max-w-200 mx-auto">
          <h2 className="pt-14 mb-10 text-3xl font-bold text-center flex items-center justify-center gap-3.5">
            <LogoIcon width={30} />
            特定商取引法に基づく表記
          </h2>
          <Row label="販売事業者">船橋 一汰</Row>
          <Row label="所在地">
            ※請求があった場合には遅滞なく開示いたします。
          </Row>
          <Row label="メールアドレス">support@mutar.ai</Row>
          <Row label="販売価格">有料プラン一覧画面に表示</Row>
          <Row label="商品代金以外の必要料金">
            インターネット接続料金、通信料金等はお客様の負担となります。
          </Row>
          <Row label="支払方法">クレジットカード決済</Row>
          <Row label="支払時期">申込時または各契約更新時に決済されます。</Row>
          <Row label="役務の提供時期">
            決済完了後、直ちに利用可能になります。
          </Row>
          <Row label="返品・キャンセルについて">
            デジタルサービスの性質上、購入後の返金には応じません。
            ただし、法令上必要な場合を除きます。
          </Row>
          <Row label="動作環境">
            OS: MacOS, Windows
            <br />
            ブラウザ: Google Chrome最新バージョン
          </Row>
        </div>
      </div>
    </div>
  )
}
