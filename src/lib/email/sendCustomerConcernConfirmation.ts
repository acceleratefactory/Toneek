import { Resend } from 'resend';

export async function sendCustomerConcernConfirmation({
  customerName,
  email,
}: {
  customerName: string;
  email: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'support@toneek.com',
      to: email,
      subject: 'We have received your concern report',
      html: `
        <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:24px;color:#3A2820;">
          <h2 style="font-size:24px;margin-top:0;">Hello ${customerName || ''},</h2>
          <p style="line-height:1.6;">We have successfully received your concern report. Your skin's health is our absolute priority.</p>
          <p style="line-height:1.6;">Our clinical team has been immediately notified and is currently reviewing your profile. <strong>Please pause all usage of your formula</strong> until you hear back from us.</p>
          <p style="line-height:1.6;">We will be in touch shortly via WhatsApp or email with next steps.</p>
          <br/>
          <p style="line-height:1.6;margin:0;">Take care,</p>
          <p style="line-height:1.6;font-weight:bold;margin:0;">The Toneek Clinical Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send customer concern confirmation email:', err);
  }
}
