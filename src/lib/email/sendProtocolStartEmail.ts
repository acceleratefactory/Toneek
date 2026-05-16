import { Resend } from 'resend';

export async function sendProtocolStartEmail({
  email,
  customerName,
  baseUrl,
}: {
  email: string;
  customerName: string;
  baseUrl: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.FROM_EMAIL ?? 'onboarding@toneek.com';

    await resend.emails.send({
      from,
      to: email,
      subject: '🧴 Day 1 — Your Clinical Protocol begins tonight',
      html: `
        <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
          <h2 style="color:#059669;margin:0 0 16px;">Welcome to Day 1</h2>
          <p style="color:#374151;margin:0 0 8px;">Hi ${customerName},</p>
          <p style="color:#374151;margin:0 0 24px;">
            You have successfully logged your delivery. This marks Day 1 of your clinical protocol.
          </p>

          <div style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;border:1px solid #e5e7eb;">
            <h3 style="margin:0 0 12px;color:#111827;font-size:16px;">The First 7 Days: Slow & Steady</h3>
            <p style="margin:0 0 12px;color:#4b5563;font-size:14px;line-height:1.6;">
              Because your formula contains potent clinical actives, we need your skin to acclimatise. For the first week, please follow these strict rules:
            </p>
            <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.6;">
              <li style="margin-bottom:6px;">Use your active formula <strong>only every other night</strong>.</li>
              <li style="margin-bottom:6px;">Apply exactly <strong>one pump</strong>. Do not use more.</li>
              <li style="margin-bottom:0;">Always use your <strong>SPF 50</strong> every single morning.</li>
            </ul>
          </div>

          <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#065f46;font-weight:600;">
              Your Dashboard is now unlocked
            </p>
            <p style="margin:6px 0 0;color:#047857;font-size:14px;">
              Your complete, step-by-step daily routine is now live on your Toneek dashboard.
            </p>
          </div>

          <a href="${baseUrl}/dashboard"
             style="display:inline-block;background:#0f0f0f;color:#fff;
                    padding:14px 28px;border-radius:8px;text-decoration:none;
                    font-weight:600;font-size:15px;">
            View my Routine →
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Customer protocol start email failed:', err);
  }
}
