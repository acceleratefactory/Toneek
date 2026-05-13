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

    // Fall back to skin_assessments if formula_code not on order
    let formulaCode = latestOrder?.formula_code ?? null
    if (!formulaCode) {
      const { data: assessment } = await adminClient
        .from('skin_assessments')
        .select('formula_code')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      formulaCode = assessment?.formula_code ?? 'N/A'
    }

    const customerName = profile?.full_name ?? 'Unknown Customer'
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
        review_status:     'pending_review',   // Phase I: provisional hold — not a permanent blacklist
        submitted_at:      new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('concern_reports insert error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // ── Phase A, C, D: Feed back into the clinical profile ──────────────────
    // Phase C: Count how many concern reports exist for this user.
    const { count: reportCount } = await adminClient
      .from('concern_reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    const isRepeat = (reportCount || 1) >= 2

    // Phase D: Fetch current adverse_formula_history to append the new reaction
    const { data: currentAssessment } = await adminClient
      .from('skin_assessments')
      .select('id, adverse_formula_history')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const currentHistory = Array.isArray(currentAssessment?.adverse_formula_history) 
      ? currentAssessment!.adverse_formula_history 
      : []
    const updatedHistory = [...currentHistory, formulaCode]

    // 1. Flag skin_assessments so admin Customers section surfaces this customer
    const baseFlagReason = `Adverse reaction reported on Day ${day_of_protocol || '?'}: ${description.slice(0, 120)}`
    const flagReason = isRepeat 
      ? `Chemist review required — 2+ adverse reports on ${formulaCode}`
      : baseFlagReason

    const updatePayload = {
      is_flagged_for_review: true,
      flag_reason:           flagReason,
      adverse_formula_history: updatedHistory,
    }

    if (currentAssessment?.id) {
      await adminClient.from('skin_assessments').update(updatePayload).eq('id', currentAssessment.id)
    } else {
      await adminClient.from('skin_assessments').update(updatePayload).eq('user_id', session.user.id)
    }

    // 2. Insert a skin_outcomes record for THIS specific concern report.
    // Every concern gets its own row — linked by concern_report_id.
    // This builds a complete longitudinal adverse reaction history.
    // Phase B fix: removed the existingAdverse guard so multiple concerns
    // are each permanently recorded, not silently dropped after the first.
    await adminClient.from('skin_outcomes').insert({
      user_id:           session.user.id,
      check_in_week:     0,
      improvement_score: null,
      adverse_reactions: true,
      adverse_detail:    `Emergency concern report — Day ${day_of_protocol || 'unknown'}: ${description}`,
      check_in_channel:  'concern_report',
      concern_report_id: report?.id ?? null,   // links this row to its specific report
      recorded_at:       new Date().toISOString(),
      anything_changed:  false,
      change_detail:     null,
    })

    // ── Phase D: Automatically update formula to barrier-safe conservative ──
    // No new assessment form needed. The system adapts the formula immediately
    // the moment a concern is reported. The original formula is preserved so
    // admin can restore it after resolution if appropriate.
    const ADVERSE_SAFE_MAP: Record<string, string> = {
      'LG-OA-01': 'LG-DH-01',  // humid/oily acne        → barrier repair
      'LG-OB-01': 'LG-DB-01',  // humid/oily PIH         → conservative PIH
      'LG-CA-01': 'LG-DH-01',  // humid/combo acne       → barrier repair
      'LG-CB-01': 'LG-DB-01',  // humid/combo PIH        → conservative PIH
      'LG-OH-01': 'LG-DH-01',  // humid/oily oiliness    → barrier repair
      'AB-OA-01': 'AB-DH-01',  // arid/oily acne         → barrier repair
      'AB-OB-01': 'AB-DB-01',  // arid/oily PIH          → conservative PIH
      'GN-CA-01': 'GN-DH-01',  // general/combo          → barrier repair
      'GN-CB-01': 'GN-NB-01',  // general/combo PIH      → conservative PIH
      'GN-OT-01': 'GN-DH-01',  // general/oily           → barrier repair
      'GN-NT-01': 'GN-DH-01',  // general/normal         → barrier repair
      'GN-NB-01': 'GN-DH-01',  // general/normal PIH     → barrier repair
      'M-OA-01':  'M-OB-01',   // male/oily              → conservative
      'M-CA-01':  'GN-SN-01',  // male/combo acne        → sensitive/minimal
      'RP-HT-02': 'RP-HT-01',  // restoration advanced   → restoration baseline
      'RP-SA-02': 'RP-SA-01',  // restoration arid adv   → restoration baseline
      'RP-HT-03': 'RP-HT-01',  // restoration optimised  → restoration baseline
      'RP-SA-03': 'RP-SA-01',  // restoration arid opt   → restoration baseline
    }

    let autoAdjustedFormula: string | null = null
    try {
      const { data: currentAssessment } = await adminClient
        .from('skin_assessments')
        .select('id, formula_code, formula_tier')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (currentAssessment?.formula_code) {
        const currentCode = currentAssessment.formula_code
        const safeCode    = ADVERSE_SAFE_MAP[currentCode] ?? 'GN-SN-01'

        // Only update if the formula actually changes (avoid redundant writes)
        if (safeCode !== currentCode) {
          await adminClient
            .from('skin_assessments')
            .update({
              formula_code:            safeCode,
              formula_tier:            'conservative',
              formula_before_concern:  currentCode,   // preserve original for restore after resolution
            })
            .eq('id', currentAssessment.id)

          autoAdjustedFormula = safeCode
          console.log(`[Phase D] Formula auto-adjusted: ${currentCode} → ${safeCode} for user ${session.user.id}`)
        }
      }
    } catch (err) {
      // Non-fatal — concern is still saved even if formula update fails
      console.error('Phase D formula auto-update failed (non-fatal):', err)
    }

    // ── Fire immediate WhatsApp to admin ─────────────────────────────
    const severityEmoji = severity === 'severe' ? '🔴' : severity === 'moderate' ? '🟠' : '🟡'
    const formulaAdjustNote = autoAdjustedFormula
      ? `\n⚙️ Formula auto-adjusted: ${formulaCode} → ${autoAdjustedFormula} (conservative)`
      : ''
    const repeatAlert = isRepeat ? '⚠️ REPEAT ADVERSE REPORTER — 2nd+ concern\n' : ''
    const whatsappMessage = `${repeatAlert}${severityEmoji} URGENT — CONCERN REPORT\n\nCustomer: ${customerName}\nFormula: ${formulaCode}\nSeverity: ${severity.toUpperCase()}\nSuspected product: ${suspected_product}\nDay of protocol: ${day_of_protocol || 'Not specified'}${formulaAdjustNote}\n\nReport:\n"${description}"\n\nReview now: ${adminUrl}`

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
      autoAdjustedFormula,
      isRepeat,
    })

    // ── Phase F: Systemic Adaptation (Population-Level Pattern Detection) ──
    try {
      if (formulaCode && formulaCode !== 'N/A') {
        const { count: globalFormulaCount } = await adminClient
          .from('concern_reports')
          .select('*', { count: 'exact', head: true })
          .eq('formula_code', formulaCode)

        if (globalFormulaCount && globalFormulaCount >= 5) {
          // Upsert to rule_performance table
          await adminClient
            .from('rule_performance')
            .upsert({
              formula_code: formulaCode,
              adverse_report_count: globalFormulaCount,
              flag: 'concentration_review_required',
              flagged_at: new Date().toISOString(),
              notes: 'System flagged due to 5+ adverse reports across different customers.',
              updated_at: new Date().toISOString()
            }, { onConflict: 'formula_code' })
          
          // Send one-time system alert when crossing the exact threshold
          if (globalFormulaCount === 5) {
            const systemAlert = `⚠️ SYSTEM FLAG — ${formulaCode} has received 5 adverse reaction reports across different customers. A chemist concentration review is recommended.`;
            await fireWhatsApp(systemAlert);
          }
        }
      }
    } catch (err) {
      console.error('Phase F systemic adaptation error:', err)
    }

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
  autoAdjustedFormula,
  isRepeat,
}: any) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const severityColor =
      severity === 'severe'   ? '#DC2626' :
      severity === 'moderate' ? '#D97706' : '#CA8A04'

    const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1)

    const repeatBanner = isRepeat ? `
      <div style="background:#B91C1C;padding:12px 24px;">
        <p style="color:white;margin:0;font-size:14px;font-weight:700;">
          ⚠️ REPEAT ADVERSE REPORTER — Chemist review required
        </p>
      </div>
    ` : ''

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@toneek.com',
      to:   process.env.ADMIN_EMAIL || 'admin@toneek.com',
      subject: `⚠️ Urgent Concern Report — ${customerName} (${severityLabel})`,
      html: `
        <div style="font-family:system-ui;max-width:600px;margin:0 auto;border:2px solid ${severityColor};border-radius:12px;overflow:hidden;">
          ${repeatBanner}
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
              ${autoAdjustedFormula ? `
              <tr style="background:#FEF3C7;">
                <td style="padding:8px 0;color:#92400E;font-size:13px;font-weight:700;">⚙️ System Action</td>
                <td style="padding:8px 0;color:#92400E;font-size:13px;font-weight:700;">Formula auto-adjusted: ${formulaCode} → ${autoAdjustedFormula} (conservative)</td>
              </tr>` : ''}
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
