// src/app/api/report-concern/submit/route.ts
// Handles emergency concern report submissions from customers.
// Saves to the database AND fires immediate WhatsApp + email to admin.
// Same urgency level as a payment confirmation — no queuing.

import { adminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // ── Authenticate the customer ────────────────────────────────────
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { suspected_product, severity, description, day_of_protocol, photo_url } = await request.json()

    if (!description || !severity || !suspected_product) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── Fetch customer profile & latest order ────────────────────────
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', session.user.id)
      .single()

    const { data: latestOrder } = await adminClient
      .from('orders')
      .select('formula_code, routine_tier, received_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const customerName = profile?.full_name ?? 'Unknown Customer'
    const formulaCode  = latestOrder?.formula_code ?? 'N/A'
    const adminUrl     = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/concern-reports`

    // ── Save to database ─────────────────────────────────────────────
    const { data: report, error: dbError } = await adminClient
      .from('concern_reports')
      .insert({
        user_id:           session.user.id,
        formula_code:      formulaCode,
        suspected_product,
        severity,
        description,
        day_of_protocol:   day_of_protocol || null,
        photo_url:         photo_url || null,
        status:            'open',
        submitted_at:      new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('concern_reports insert error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // ── Fire immediate WhatsApp to admin ─────────────────────────────
    const severityEmoji = severity === 'severe' ? '🔴' : severity === 'moderate' ? '🟠' : '🟡'
    const whatsappMessage = `${severityEmoji} URGENT — CONCERN REPORT\n\nCustomer: ${customerName}\nFormula: ${formulaCode}\nSeverity: ${severity.toUpperCase()}\nSuspected product: ${suspected_product}\nDay of protocol: ${day_of_protocol || 'Not specified'}\n\nReport:\n"${description}"\n\nReview now: ${adminUrl}`

    await fireWhatsApp(whatsappMessage)

    // ── Fire immediate email to admin ────────────────────────────────
    await fireAdminEmail({
      customerName,
      formulaCode,
      severity,
      suspectedProduct: suspected_product,
      dayOfProtocol: day_of_protocol,
      description,
      photoUrl: photo_url,
      adminUrl,
      reportId: report?.id,
    })

    return NextResponse.json({ success: true, report_id: report?.id })

  } catch (err: any) {
    console.error('report-concern submit error:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}

// ── WhatsApp fire (immediate, no queue) ───────────────────────────────────────
async function fireWhatsApp(message: string) {
  const apiUrl  = process.env.WHATSAPP_API_URL
  const apiKey  = process.env.WHATSAPP_API_TOKEN
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE

  if (!apiUrl || !apiKey || !adminPhone) {
    console.log('[WhatsApp ADMIN CONCERN]:', message)
    return
  }

  try {
    await fetch(`${apiUrl}?phone=${adminPhone}&apikey=${apiKey}&text=${encodeURIComponent(message)}`)
  } catch (err) {
    console.error('Admin WhatsApp fire failed:', err)
  }
}

// ── Admin email fire (immediate, no queue) ────────────────────────────────────
async function fireAdminEmail({
  customerName,
  formulaCode,
  severity,
  suspectedProduct,
  dayOfProtocol,
  description,
  photoUrl,
  adminUrl,
  reportId,
}: any) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const severityColor =
      severity === 'severe'   ? '#DC2626' :
      severity === 'moderate' ? '#D97706' : '#CA8A04'

    const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1)

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@toneek.com',
      to:   process.env.ADMIN_EMAIL || 'admin@toneek.com',
      subject: `⚠️ Urgent Concern Report — ${customerName} (${severityLabel})`,
      html: `
        <div style="font-family:system-ui;max-width:600px;margin:0 auto;border:2px solid ${severityColor};border-radius:12px;overflow:hidden;">
          
          <div style="background:${severityColor};padding:20px 24px;">
            <h1 style="color:white;margin:0;font-size:20px;">
              ⚠️ Urgent Concern Report — Action Required
            </h1>
            <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px;">
              This report requires a response within a few hours.
            </p>
          </div>

          <div style="padding:24px;background:white;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr>
                <td style="padding:8px 0;color:#6B7280;font-size:13px;width:40%;font-weight:600;">Customer</td>
                <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:700;">${customerName}</td>
              </tr>
              <tr style="background:#F9FAFB;">
                <td style="padding:8px 0;color:#6B7280;font-size:13px;font-weight:600;">Formula</td>
                <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:700;">${formulaCode}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6B7280;font-size:13px;font-weight:600;">Severity</td>
                <td style="padding:8px 0;font-size:13px;font-weight:700;color:${severityColor};">${severityLabel}</td>
              </tr>
              <tr style="background:#F9FAFB;">
                <td style="padding:8px 0;color:#6B7280;font-size:13px;font-weight:600;">Suspected Product</td>
                <td style="padding:8px 0;color:#111827;font-size:13px;">${suspectedProduct}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6B7280;font-size:13px;font-weight:600;">Day of Protocol</td>
                <td style="padding:8px 0;color:#111827;font-size:13px;">${dayOfProtocol || 'Not specified'}</td>
              </tr>
            </table>

            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin-bottom:20px;">
              <p style="margin:0 0 6px;color:#991B1B;font-weight:700;font-size:13px;">Customer's Report:</p>
              <p style="margin:0;color:#7F1D1D;font-size:14px;line-height:1.6;">"${description}"</p>
            </div>

            ${photoUrl ? `
            <div style="margin-bottom:20px;">
              <p style="margin:0 0 8px;color:#6B7280;font-size:13px;font-weight:600;">Photo uploaded:</p>
              <img src="${photoUrl}" alt="Reaction photo" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;border:1px solid #E5E7EB;" />
            </div>
            ` : ''}

            <a href="${adminUrl}"
               style="display:inline-block;background:${severityColor};color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-top:8px;">
              Review in Admin Dashboard →
            </a>

            <p style="color:#9CA3AF;font-size:11px;margin-top:20px;">
              Report ID: ${reportId} · Submitted: ${new Date().toLocaleString('en-GB')}
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('Admin concern email failed:', err)
  }
}
