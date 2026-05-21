import { Resend } from 'resend';

export async function sendAdminSubscriptionAlert({
  customerName,
  subscriptionId,
  action,
  reason,
  userId,
}: {
  customerName: string;
  subscriptionId: string;
  action: 'paused' | 'cancelled';
  reason?: string;
  userId: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/customers/${userId}`;
    
    const color = action === 'cancelled' ? '#DC2626' : '#F59E0B'; // Red for cancel, Orange for pause
    const actionLabel = action === 'cancelled' ? 'Cancelled' : 'Paused';

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@toneek.com',
      to: process.env.ADMIN_EMAIL || 'hello@toneek.com',
      subject: `Subscription ${actionLabel} — ${customerName || 'Customer'}`,
      html: `
        <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:24px;">
          <div style="background:${color};padding:12px 24px;margin-bottom:16px;border-radius:8px;">
            <p style="color:white;margin:0;font-size:14px;font-weight:700;">
              ⚠️ SUBSCRIPTION ALERT — Action: ${actionLabel.toUpperCase()}
            </p>
          </div>
          
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#F9FAFB;">
              <td style="padding:12px;color:#6B7280;font-weight:600;width:40%;">Customer</td>
              <td style="padding:12px;color:#111827;font-weight:700;">${customerName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#6B7280;font-weight:600;">Subscription ID</td>
              <td style="padding:12px;color:#111827;font-family:monospace;">${subscriptionId}</td>
            </tr>
            ${reason ? `
            <tr style="background:#F9FAFB;">
              <td style="padding:12px;color:#6B7280;font-weight:600;">Provided Reason</td>
              <td style="padding:12px;color:#111827;"><i>"${reason}"</i></td>
            </tr>
            ` : ''}
          </table>

          <p style="color:#4B5563;font-size:14px;">
            Please check if there are any active orders in pending_production or pending_dispatch for this customer that need to be halted.
          </p>

          <a href="${adminUrl}" style="display:inline-block;background:#3A2820;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px;">
            View Customer Profile →
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send admin subscription alert email:', err);
  }
}
