import { Resend } from 'resend'

export async function sendUpgradeEmail({
  email,
  customerName,
  planTier,
  baseUrl,
}: {
  email: string
  customerName: string
  planTier: string
  baseUrl: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const plan_display = planTier
    .replace('_', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'support@toneek.com',
    to: email,
    subject: `Your plan has been upgraded to ${plan_display}`,
    html: `
      <div style="font-family:system-ui;max-width:560px;margin:0 auto;background:#2A0F06;padding:0;">
        <div style="padding:32px;text-align:center;border-bottom:1px solid rgba(200,125,62,0.3);">
          <h1 style="color:#C87D3E;font-size:24px;margin:0;">toneek</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#F7F1EB;font-size:20px;margin:0 0 16px;">
            Hi ${customerName}, your upgrade is confirmed.
          </h2>
          <p style="color:#F7F1EB;opacity:0.8;font-size:14px;line-height:1.6;">
            We have received your payment. Your Toneek plan is now fully upgraded to <strong>${plan_display}</strong>.
          </p>
          <p style="color:#F7F1EB;opacity:0.8;font-size:14px;line-height:1.6;">
            Your new features are instantly active on your dashboard.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${baseUrl}/dashboard"
               style="display:inline-block;background:#C87D3E;color:#2A0F06;
                      padding:16px 40px;border-radius:8px;text-decoration:none;
                      font-weight:700;">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    `,
  })
}
