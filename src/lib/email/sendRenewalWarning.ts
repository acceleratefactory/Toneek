import { Resend } from 'resend';

export async function sendRenewalWarning({
  email,
  customerName,
  renewalDate,
  amount,
  currency,
  baseUrl,
}: {
  email: string;
  customerName: string;
  renewalDate: string;
  amount: number;
  currency: string;
  baseUrl: string;
}) {
  const SYMBOLS: Record<string, string> = {
    NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵', CAD: 'CA$',
  };
  const symbol = SYMBOLS[currency] ?? '';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.FROM_EMAIL ?? 'billing@toneek.com';

    await resend.emails.send({
      from,
      to: email,
      subject: 'Reminder: Your upcoming Toneek renewal',
      html: `
        <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
          <h2 style="color:#059669;margin:0 0 16px;">Subscription Renewal Notice</h2>
          <p style="color:#374151;margin:0 0 8px;">Hi ${customerName},</p>
          <p style="color:#374151;margin:0 0 24px;">
            We're getting ready to compound your next personalized batch! This is a quick reminder that your subscription is scheduled to renew in 3 days.
          </p>

          <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:24px;border:1px solid #e5e7eb;">
            <p style="margin:0 0 4px;color:#111827;font-size:16px;">
              <strong>Upcoming Charge:</strong> ${symbol}${amount.toLocaleString()}
            </p>
            <p style="margin:0;color:#6b7280;font-size:14px;">
              <strong>Date:</strong> ${renewalDate}
            </p>
          </div>

          <p style="color:#374151;margin:0 0 24px;font-size:14px;">
            If you need to update your address, complete a pending check-in, or pause your subscription, please do so from your dashboard before the renewal date.
          </p>

          <a href="${baseUrl}/dashboard"
             style="display:inline-block;background:#0f0f0f;color:#fff;
                    padding:14px 28px;border-radius:8px;text-decoration:none;
                    font-weight:600;font-size:15px;">
            Manage Subscription →
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Customer renewal warning email failed:', err);
  }
}
