import { Resend } from 'resend';

export async function sendAdminAssessmentEmail({
  customerName,
  formulaCode,
  skinOsScore,
  primaryConcern,
  riskScore,
  assessmentId,
}: {
  customerName: string;
  formulaCode: string;
  skinOsScore: number;
  primaryConcern: string;
  riskScore: number;
  assessmentId: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/assessments/${assessmentId}`;
    
    let riskBanner = '';
    if (riskScore > 0.75) {
      riskBanner = `
      <div style="background:#DC2626;padding:12px 24px;margin-bottom:16px;border-radius:8px;">
        <p style="color:white;margin:0;font-size:14px;font-weight:700;">
          ⚠️ HIGH RISK FLAG — Chemist Review Recommended
        </p>
      </div>`;
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@toneek.com',
      to: process.env.ADMIN_EMAIL || 'hello@toneek.com',
      subject: `New Assessment Submitted — ${customerName || 'Customer'}`,
      html: `
        <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:24px;">
          ${riskBanner}
          <h2 style="color:#111827;margin-top:0;">New Assessment Submitted</h2>
          <p style="color:#4B5563;">A new skin assessment has been completed.</p>
          
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr style="background:#F9FAFB;">
              <td style="padding:12px;color:#6B7280;font-weight:600;width:40%;">Customer</td>
              <td style="padding:12px;color:#111827;font-weight:700;">${customerName || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#6B7280;font-weight:600;">Formula Assigned</td>
              <td style="padding:12px;color:#111827;font-weight:700;">${formulaCode}</td>
            </tr>
            <tr style="background:#F9FAFB;">
              <td style="padding:12px;color:#6B7280;font-weight:600;">Skin OS Score</td>
              <td style="padding:12px;color:#111827;font-weight:700;">${skinOsScore}/100</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#6B7280;font-weight:600;">Primary Concern</td>
              <td style="padding:12px;color:#111827;">${primaryConcern}</td>
            </tr>
          </table>

          <a href="${adminUrl}" style="display:inline-block;background:#3A2820;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            View Full Assessment →
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send admin assessment email:', err);
  }
}
