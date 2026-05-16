import { Resend } from 'resend';

export async function sendCheckinReminder({
  email,
  customerName,
  week,
  baseUrl,
}: {
  email: string;
  customerName: string;
  week: number;
  baseUrl: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.FROM_EMAIL ?? 'onboarding@toneek.com';

    await resend.emails.send({
      from,
      to: email,
      subject: `Action Required: Your Week ${week} Clinical Check-in is due`,
      html: `
        <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
          <h2 style="color:#059669;margin:0 0 16px;">Week ${week} Check-in</h2>
          <p style="color:#374151;margin:0 0 8px;">Hi ${customerName},</p>
          <p style="color:#374151;margin:0 0 24px;">
            It's time for your Week ${week} clinical check-in. Logging your progress is crucial to ensure your formula is perfectly adapted to your skin's changing needs.
          </p>

          <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#065f46;font-weight:600;">
              Why this matters
            </p>
            <p style="margin:6px 0 0;color:#047857;font-size:14px;">
              Our clinical team relies on your check-in data to adjust your next subscription batch. If you skip your check-in, your next formula cannot be optimized.
            </p>
          </div>

          <a href="${baseUrl}/dashboard"
             style="display:inline-block;background:#0f0f0f;color:#fff;
                    padding:14px 28px;border-radius:8px;text-decoration:none;
                    font-weight:600;font-size:15px;">
            Complete my check-in →
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Customer check-in reminder email failed:', err);
  }
}
