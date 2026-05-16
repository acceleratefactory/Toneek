export async function sendRenewalEmail({
  email, name, plan, currency, amount, renewal_url, billing_date
}: {
  email: string
  name: string
  plan: string
  currency: string
  amount?: number
  renewal_url: string
  billing_date: string
}) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const currency_symbols: Record<string, string> = {
    NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵'
  }
  const symbol = currency_symbols[currency] ?? ''
  const amount_display = amount ? \`\${symbol}\${amount.toLocaleString()}\` : 'your plan amount'

  const billing_date_display = new Date(billing_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'billing@toneek.com',
    to: email,
    subject: \`Your Toneek formula renews in 7 days — action required\`,
    html: \`
      <div style="font-family:system-ui;max-width:560px;margin:0 auto;
                  background:#2A0F06;padding:0;">
        
        <div style="padding:32px;text-align:center;border-bottom:1px solid rgba(200,125,62,0.3);">
          <h1 style="color:#C87D3E;font-size:24px;margin:0;">toneek</h1>
          <p style="color:#F7F1EB;opacity:0.6;font-size:12px;margin:4px 0 0;">
            Skin intelligence for melanin-rich skin
          </p>
        </div>

        <div style="padding:32px;">
          <h2 style="color:#F7F1EB;font-size:20px;margin:0 0 16px;">
            Hi \${name}, your formula renewal is due.
          </h2>
          
          <div style="background:rgba(255,255,255,0.05);border-radius:8px;
                      padding:20px;margin:20px 0;">
            <p style="color:#8C7B72;font-size:11px;margin:0 0 4px;
                      text-transform:uppercase;letter-spacing:2px;">Renewal date</p>
            <p style="color:#F7F1EB;font-size:18px;font-weight:600;margin:0;">
              \${billing_date_display}
            </p>
            <p style="color:#8C7B72;font-size:11px;margin:8px 0 0;
                      text-transform:uppercase;letter-spacing:2px;">Plan</p>
            <p style="color:#F7F1EB;font-size:16px;margin:4px 0 0;">\${plan}</p>
            <p style="color:#8C7B72;font-size:11px;margin:8px 0 0;
                      text-transform:uppercase;letter-spacing:2px;">Amount</p>
            <p style="color:#C87D3E;font-size:20px;font-weight:700;margin:4px 0 0;">
              \${amount_display}
            </p>
          </div>

          <p style="color:#F7F1EB;opacity:0.8;font-size:14px;line-height:1.6;">
            Your next formula is ready to be compounded the moment payment is confirmed. 
            Click below to get your bank transfer details instantly — no login required.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="\${renewal_url}"
               style="display:inline-block;background:#C87D3E;color:#2A0F06;
                      padding:16px 40px;border-radius:8px;text-decoration:none;
                      font-weight:700;font-size:16px;letter-spacing:0.5px;">
              Get my renewal invoice →
            </a>
          </div>

          <p style="color:#8C7B72;font-size:12px;text-align:center;margin:16px 0 0;">
            This link is valid for 10 days. Payment by bank transfer only.<br>
            Your formula is compounded on payment confirmation.
          </p>
        </div>

        <div style="padding:20px 32px;border-top:1px solid rgba(200,125,62,0.3);
                    text-align:center;">
          <p style="color:#8C7B72;font-size:11px;margin:0;">
            Toneek · Skin intelligence for melanin-rich skin<br>
            <a href="\${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" 
               style="color:#C87D3E;">View your dashboard</a>
          </p>
        </div>
      </div>
    \`,
  })
}
