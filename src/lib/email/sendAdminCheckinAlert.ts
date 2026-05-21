import { Resend } from 'resend';

export async function sendAdminCheckinAlert({
  customerName,
  week,
  improvementScore,
  adverseReactions,
  userId,
}: {
  customerName: string;
  week: number;
  improvementScore: number;
  adverseReactions: boolean;
  userId: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/customers/${userId}`;
    
    let warningBanner = '';
    if (adverseReactions || improvementScore < 4) {
      warningBanner = `
      <div style="background:#F59E0B;padding:12px 24px;margin-bottom:16px;border-radius:8px;">
        <p style="color:#78350F;margin:0;font-size:14px;font-weight:700;">
          ⚠️ REVIEW RECOMMENDED — Low score or adverse reactions reported
        </p>
      </div>`;
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@toneek.com',
      to: process.env.ADMIN_EMAIL || 'hello@toneek.com',
      subject: `Check-in Completed (Week ${week}) — ${customerName || 'Customer'}`,
      html: `
        <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:24px;">
          ${warningBanner}
          <h2 style="color:#111827;margin-top:0;">Week ${week} Check-in Logged</h2>
          
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#F9FAFB;">
              <td style="padding:12px;color:#6B7280;font-weight:600;width:40%;">Customer</td>
              <td style="padding:12px;color:#111827;font-weight:700;">${customerName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#6B7280;font-weight:600;">Improvement Score</td>
              <td style="padding:12px;color:#111827;font-weight:700;">${improvementScore}/10</td>
            </tr>
            <tr style="background:#F9FAFB;">
              <td style="padding:12px;color:#6B7280;font-weight:600;">Adverse Reactions?</td>
              <td style="padding:12px;color:${adverseReactions ? '#DC2626' : '#10B981'};font-weight:700;">${adverseReactions ? 'Yes' : 'No'}</td>
            </tr>
          </table>

          <a href="${adminUrl}" style="display:inline-block;background:#3A2820;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            View Customer Profile →
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send admin checkin alert email:', err);
  }
}
