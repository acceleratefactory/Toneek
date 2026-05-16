import { Resend } from 'resend';

export async function sendWelcomeEmail({
  email,
  customerName,
  order,
  baseUrl,
}: {
  email: string;
  customerName: string;
  order: any;
  baseUrl: string;
}) {
  const SYMBOLS: Record<string, string> = {
    NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵', CAD: 'CA$',
  };
  const symbol = SYMBOLS[order.currency] ?? '';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.FROM_EMAIL ?? 'onboarding@toneek.com';

    await resend.emails.send({
      from,
      to: email,
      subject: '✅ Payment confirmed — your formula is being prepared',
      html: `
        <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
          <h2 style="color:#059669;margin:0 0 16px;">Payment Confirmed</h2>
          <p style="color:#374151;margin:0 0 8px;">Hi ${customerName},</p>
          <p style="color:#374151;margin:0 0 24px;">
            Your payment has been confirmed and your Toneek subscription is now active.
          </p>
          <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#065f46;font-weight:600;">
              Your formula is going into production
            </p>
            <p style="margin:6px 0 0;color:#047857;font-size:14px;">
              You'll receive WhatsApp and email updates when it dispatches.
            </p>
          </div>
          <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#6b7280;font-size:14px;">
              <strong>Reference:</strong> ${order.payment_reference}<br/>
              <strong>Amount:</strong> ${symbol}${order.payment_amount?.toLocaleString()}<br/>
              <strong>Plan:</strong> ${order.plan_tier}
            </p>
          </div>
          <a href="${baseUrl}/dashboard"
             style="display:inline-block;background:#0f0f0f;color:#fff;
                    padding:14px 28px;border-radius:8px;text-decoration:none;
                    font-weight:600;font-size:15px;">
            View your dashboard →
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Customer confirmation email failed:', err);
  }
}
