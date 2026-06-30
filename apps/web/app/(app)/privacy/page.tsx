import LogoIcon from "@/components/logo-icon"

function Section({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <section className="mt-9">
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      <div className="space-y-3 leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

export default async function Page() {
  return (
    <div>
      <div className="min-h-full pb-10 sm:px-10 px-5">
        <div className="max-w-200 mx-auto">
          <h2 className="pt-14 mb-10 text-3xl font-bold text-center flex items-center justify-center gap-3.5">
            <LogoIcon width={30} />
            プライバシーポリシー
          </h2>

          <div className="leading-7 text-muted-foreground">
            船橋
            一汰（以下「当方」といいます。）は、当方が提供するAI画像生成・編集サービス「Mutar」（以下「本サービス」といいます。）におけるユーザー情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
          </div>

          <Section title="第1条（取得する情報）">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                アカウント情報:
                氏名、表示名、メールアドレス、プロフィール画像、外部ログインサービスの識別子その他登録時に提供される情報
              </li>
              <li>
                利用情報:
                プラン、クレジット残高、生成回数、利用日時、操作履歴、プロジェクト情報、設定情報、問い合わせ内容
              </li>
              <li>
                入力データおよび生成物:
                ユーザーが入力したプロンプト、アップロード画像、編集内容、生成画像、テキストレイヤー、関連するメタデータ
              </li>
              <li>
                決済関連情報:
                決済状態、購入履歴、請求に必要な情報。なお、クレジットカード番号等は決済代行事業者が管理し、当方が直接保存しない場合があります。
              </li>
              <li>
                技術情報:
                Cookie、IPアドレス、端末情報、ブラウザ情報、OS、リファラ、アクセスログ、エラー情報、セッション情報
              </li>
              <li>
                外部サービス連携情報:
                Googleログイン等の外部サービス連携時にユーザーが許可した範囲の情報
              </li>
            </ol>
          </Section>

          <Section title="第2条（利用目的）">
            <ol className="list-decimal space-y-2 pl-5">
              <li>本サービスの登録、本人認証、アカウント管理のため</li>
              <li>
                画像生成、画像編集、プロジェクト保存、クレジット管理その他本サービスの機能提供のため
              </li>
              <li>有料プランの申込、決済、請求、購入履歴管理のため</li>
              <li>問い合わせ対応、本人確認、重要なお知らせの送付のため</li>
              <li>
                不正利用、規約違反、障害、セキュリティリスクの検知および対応のため
              </li>
              <li>本サービスの保守、改善、品質向上、利用状況分析のため</li>
              <li>新機能、キャンペーン、規約変更等に関する案内のため</li>
              <li>法令、裁判所、行政機関等の要請に対応するため</li>
              <li>上記に付随する目的のため</li>
            </ol>
          </Section>

          <Section title="第3条（入力データおよび生成物の取扱い）">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                当方は、本サービスの提供、保存、表示、編集、再生成、問い合わせ対応、不正利用防止、品質改善に必要な範囲で、入力データおよび生成物を取り扱います。
              </li>
              <li>
                ユーザーは、個人情報、機密情報、第三者の権利を含む情報を入力する場合、自らの責任で必要な権利、許諾、同意を取得するものとします。
              </li>
              <li>
                本サービスはAIモデルその他外部サービスを利用する場合があり、入力データまたは生成に必要な情報が外部サービスへ送信されることがあります。
              </li>
            </ol>
          </Section>

          <Section title="第4条（第三者提供）">
            <p>
              当方は、次の場合を除き、ユーザーの個人情報を第三者に提供しません。
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>
                人の生命、身体または財産の保護のために必要で、本人の同意取得が困難な場合
              </li>
              <li>
                公衆衛生の向上または児童の健全な育成推進のために特に必要で、本人の同意取得が困難な場合
              </li>
              <li>
                国の機関、地方公共団体またはその委託先による法令上の事務に協力する必要があり、本人の同意取得により当該事務の遂行に支障を及ぼすおそれがある場合
              </li>
              <li>
                事業譲渡、承継、組織再編その他これらに準じる手続に伴い提供する場合
              </li>
            </ol>
          </Section>

          <Section title="第5条（外部委託および外部サービス）">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                当方は、利用目的の達成に必要な範囲で、クラウドホスティング、データ保管、認証、決済、メール送信、AIモデル提供、分析、カスタマーサポート等の業務を外部事業者に委託する場合があります。
              </li>
              <li>
                委託先には、Google、Cloudflare、決済代行事業者、AIモデル提供事業者、メール配信事業者、データベース・ホスティング事業者等が含まれる場合があります。
              </li>
              <li>
                当方は、委託先に対して、取り扱う情報を利用目的の達成に必要な範囲に限定するよう努めます。
              </li>
            </ol>
          </Section>

          <Section title="第6条（Cookie等の利用）">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                本サービスは、ログイン状態の維持、表示設定の保存、セキュリティ、利用状況分析、機能改善のためにCookieまたはこれに類する技術を利用する場合があります。
              </li>
              <li>
                ユーザーはブラウザの設定によりCookieを無効化できます。ただし、その場合、本サービスの一部機能が利用できないことがあります。
              </li>
            </ol>
          </Section>

          <Section title="第7条（安全管理）">
            <p>
              当方は、取得した情報の漏えい、滅失、毀損、不正アクセスを防止するため、アクセス制御、認証管理、通信の保護、委託先管理その他必要かつ適切な安全管理措置を講じるよう努めます。
            </p>
          </Section>

          <Section title="第8条（開示、訂正、利用停止等）">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                ユーザーは、個人情報保護法その他適用法令に基づき、当方が保有する自己の個人情報について、開示、訂正、追加、削除、利用停止、第三者提供停止等を求めることができます。
              </li>
              <li>
                前項の請求を行う場合、ユーザーは第11条の問い合わせ先まで連絡するものとします。当方は、本人確認を行った上で、法令に従い合理的な範囲で対応します。
              </li>
            </ol>
          </Section>

          <Section title="第9条（保存期間）">
            <p>
              当方は、利用目的の達成に必要な期間、法令上必要な期間、紛争対応または不正利用防止のために合理的に必要な期間、ユーザー情報を保存します。不要となった情報は、合理的な方法により削除または匿名化します。
            </p>
          </Section>

          <Section title="第10条（本ポリシーの変更）">
            <p>
              当方は、法令変更、サービス内容の変更、運用上の必要に応じて、本ポリシーを変更することがあります。重要な変更がある場合、本サービス上での掲載その他適切な方法により通知します。
            </p>
          </Section>

          <Section title="第11条（問い合わせ窓口）">
            <p>
              本ポリシーに関する問い合わせ、開示等の請求、苦情または相談は、support@mutar.ai
              までご連絡ください。
            </p>
          </Section>

          <div className="mt-10 text-sm text-muted-foreground">
            制定日: 2026年6月30日
          </div>
        </div>
      </div>
    </div>
  )
}
