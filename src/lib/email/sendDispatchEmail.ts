import { Resend } from 'resend';

export async function sendDispatchEmail({
  email,
  customerName,
  trackingNumber,
  orderReference,
  baseUrl,
}: {
  email: string;
  customerName: string;
  trackingNumber: string;
  orderReference: string;
  baseUrl: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.FROM_EMAIL ?? 'onboarding@toneek.com';

    await resend.emails.send({
      from,
      to: email,
      subject: '📦 Your Toneek formula has been dispatched!',
      html: `
        <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
          <h2 style="color:#059669;margin:0 0 16px;">Order Dispatched</h2>
          <p style="color:#374151;margin:0 0 8px;">Hi ${customerName},</p>
          <p style="color:#374151;margin:0 0 24px;">
            Your bespoke formula has been freshly compounded, packed, and is officially on its way to you!
          </p>
          
          <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:24px;border:1px solid #e5e7eb;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;font-weight:600;">Tracking Information</p>
            <p style="margin:0 0 4px;color:#111827;font-size:16px;">
              <strong>Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="margin:0;color:#6b7280;font-size:13px;">
              Order Ref: ${orderReference}
            </p>
          </div>

          <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#065f46;font-weight:600;">
              What happens next?
            </p>
            <p style="margin:6px 0 0;color:#047857;font-size:14px;">
              When your package arrives, log into your dashboard and click "I received my product" to unlock your clinical protocol.
            </p>
          </div>

          <a href="${baseUrl}/dashboard"
             style="display:inline-block;background:#0f0f0f;color:#fff;
                    padding:14px 28px;border-radius:8px;text-decoration:none;
                    font-weight:600;font-size:15px;">
            Go to my dashboard →
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Customer dispatch email failed:', err);
  }
}
