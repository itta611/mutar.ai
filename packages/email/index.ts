import { env } from "@/lib/env"
import { Resend } from "resend"

type MagicLinkEmailInput = {
  email: string
  url: string
}

const resend = new Resend(env.RESEND_SECRET)

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export async function sendMagicLinkEmail({ email, url }: MagicLinkEmailInput) {
  const safeUrl = escapeHtml(url)
  const safeEmail = escapeHtml(email)

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM ?? "",
    to: email,
    subject: "Hengen login link",
    text: `Open this link to log in to Hengen:\n\n${url}\n\nIf you did not request this email, you can ignore it.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #191714; line-height: 1.6;">
        <p style="margin: 0 0 16px;">${safeEmail} で Hengen にログインするためのリンクです。</p>
        <p style="margin: 0 0 24px;">このリンクは短時間で期限切れになります。</p>
        <a href="${safeUrl}" style="display: inline-block; border-radius: 999px; background: #191714; color: #fff; padding: 12px 20px; text-decoration: none;">Hengen にログイン</a>
        <p style="margin: 24px 0 0; color: #6f675d; font-size: 13px;">心当たりがない場合は、このメールを破棄してください。</p>
      </div>
    `,
  })

  if (error) {
    console.error("[hengen] failed to send magic link email", error)
    throw new Error("Failed to send magic link email")
  }
}
