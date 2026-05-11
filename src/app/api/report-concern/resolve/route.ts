// src/app/api/report-concern/resolve/route.ts
// Marks a concern report as resolved and notifies the customer immediately
// via email and WhatsApp with the admin's resolution notes.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { report_id, admin_notes, formula_decision } = await request.json()
    if (!report_id) return NextResponse.json({ error: 'Missing report_id' }, { status: 400 })
    // formula_decision: 'keep_conservative' | 'restore_original' | 'flag_for_chemist'
    const decision = formula_decision ?? 'keep_conservative'

    // ── Fetch the report + customer details ──────────────────────────
    const { data: report, error: fetchError } = await adminClient
      .from('concern_reports')
      .select('id, user_id, formula_code, severity, description, suspected_product, day_of_protocol')
      .eq('id', report_id)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', report.user_id)
      .single()

    // ── Mark as resolved in database ─────────────────────────────────
    const { error: updateError } = await adminClient
      .from('concern_reports')
      .update({
        status:       'resolved',
        admin_notes:  admin_notes || null,
        resolved_at:  new Date().toISOString(),
      })
      .eq('id', report_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const customerName = profile?.full_name ?? 'Customer'
    const resolution   = admin_notes?.trim() || 'Our clinical team has reviewed your report and determined no further action is required at this time. Please continue monitoring your skin and contact us if symptoms persist.'

    // ── Phase B: Write clinical decision back to the customer's profile ──
    // 1. Fetch the most recent assessment to read existing clinical_notes
    //    so we can APPEND to them rather than overwrite. This preserves the
    //    full longitudinal clinical history across all concern reports.
    const { data: latestAssessment } = await adminClient
      .from('skin_assessments')
      .select('id, clinical_notes, flag_reason')
      .eq('user_id', report.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const newEntry    = `[${new Date().toLocaleDateString('en-GB')} — ${report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}] Concern report resolved — Suspected: ${report.suspected_product}. Day: ${report.day_of_protocol || 'unknown'}. Clinical response: ${resolution}`
    const existing    = latestAssessment?.clinical_notes?.trim() ?? ''
    const appendedNote = existing ? `${existing}\n${newEntry}` : newEntry

    // Determine whether to unflag — chemist_review_required flag (set in Phase C)
    // prevents auto-unflagging when 2+ adverse reports are on record.
    const requiresChemist = latestAssessment?.flag_reason?.includes('Chemist review required') ?? false

    await adminClient
      .from('skin_assessments')
      .update({
        clinical_notes:        appendedNote,
        is_flagged_for_review: requiresChemist ? true : false,
      })
      .eq('id', latestAssessment?.id ?? '')

    // 2. Update THIS concern report's specific skin_outcomes row.
    // Phase B fix: use concern_report_id to target the exact row, not the
    // generic check_in_week=0 filter which hits the wrong row when a customer
    // has submitted multiple concern reports.
    await adminClient
      .from('skin_outcomes')
      .update({
        adverse_detail: `${report.description} | RESOLVED: ${resolution}`,
      })
      .eq('concern_report_id', report_id)

    // ── Formula Decision (admin-controlled) ──────────────────────────
    // The formula was auto-set to conservative on concern submission.
    // Admin now decides what happens next — independently of clinical notes.
    if (decision === 'restore_original') {
      // Fetch the original formula that was saved before the concern was submitted
      const { data: assessment } = await adminClient
        .from('skin_assessments')
        .select('id, formula_before_concern, formula_tier')
        .eq('user_id', report.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (assessment?.formula_before_concern) {
        await adminClient
          .from('skin_assessments')
          .update({
            formula_code:           assessment.formula_before_concern,
            formula_tier:           'standard',           // restore to standard tier
            formula_before_concern: null,                 // clear the backup field
          })
          .eq('id', assessment.id)
      }
    } else if (decision === 'flag_for_chemist') {
      // Keep the conservative formula but flag the assessment for the chemist
      // to review active concentrations — this appears in the admin Flagged tab
      const { data: assessment } = await adminClient
        .from('skin_assessments')
        .select('id')
        .eq('user_id', report.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (assessment?.id) {
        await adminClient
          .from('skin_assessments')
          .update({
            is_flagged_for_review: true,
            flag_reason: `Chemist review requested — concern resolved but concentration adjustment may be needed. See clinical notes: ${resolution.slice(0, 100)}`,
          })
          .eq('id', assessment.id)
      }
    }
    // 'keep_conservative' — formula already at conservative variant, no action needed

    // ── Notify customer via WhatsApp ─────────────────────────────────
    if (profile?.phone) {
      const message = `Hi ${customerName}, your concern report with Toneek has been reviewed by our clinical team.\n\n📋 Our response:\n"${resolution}"\n\nIf symptoms persist or worsen, please don't hesitate to report again via your dashboard. — Toneek Clinical Team`
      await fireWhatsApp(profile.phone, message)
    }

    // ── Notify customer via email ────────────────────────────────────
    if (profile?.email) {
      await fireCustomerEmail({
        email:       profile.email,
        name:        customerName,
        formulaCode: report.formula_code,
        resolution,
        severity:    report.severity,
      })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('resolve concern error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

async function fireWhatsApp(phone: string, message: string) {
  const apiUrl  = process.env.WHATSAPP_API_URL
  const apiKey  = process.env.WHATSAPP_API_TOKEN
  if (!apiUrl || !apiKey) { console.log('[WhatsApp customer]:', message); return }
  try {
    await fetch(`${apiUrl}?phone=${phone.replace(/\D/g, '')}&apikey=${apiKey}&text=${encodeURIComponent(message)}`)
  } catch (err) { console.error('Customer WhatsApp failed:', err) }
}

async function fireCustomerEmail({ email, name, formulaCode, resolution, severity }: any) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from:    process.env.FROM_EMAIL || 'clinical@toneek.com',
      to:      email,
      subject: `Your Toneek Concern Report — Clinical Response`,
      html: `
        <div style="font-family:system-ui;max-width:580px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
          <div style="background:#2A0F06;padding:24px;">
            <h1 style="color:#C87D3E;margin:0;font-size:20px;">Toneek Clinical Team</h1>
            <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">Your concern has been reviewed</p>
          </div>
          <div style="padding:28px;">
            <p style="color:#374151;font-size:14px;margin-bottom:20px;">Hi ${name},</p>
            <p style="color:#374151;font-size:14px;line-height:1.6;margin-bottom:20px;">
              Our clinical team has reviewed your concern report${formulaCode && formulaCode !== 'N/A' ? ` for your formula <strong>${formulaCode}</strong>` : ''} and prepared the following response:
            </p>
            <div style="background:#FEF9F3;border-left:4px solid #C87D3E;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
              <p style="margin:0;color:#2A0F06;font-size:14px;line-height:1.7;">${resolution}</p>
            </div>
            <p style="color:#6B7280;font-size:13px;line-height:1.6;">
              If your symptoms persist or worsen, please use the <strong>Report a Concern</strong> button on your dashboard to submit a new report. We are always here to help.
            </p>
            <div style="margin-top:24px;padding-top:20px;border-top:1px solid #F3F4F6;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/formula"
                 style="display:inline-block;background:#2A0F06;color:#C87D3E;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">
                View Your Dashboard →
              </a>
            </div>
            <p style="color:#9CA3AF;font-size:11px;margin-top:20px;">Toneek Clinical Team · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      `,
    })
  } catch (err) { console.error('Customer concern email failed:', err) }
}
