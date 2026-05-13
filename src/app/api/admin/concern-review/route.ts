// src/app/api/admin/concern-review/route.ts
// Phase I: Clinical Governance — Admin clinical decision endpoint.
// Allows an admin to either confirm a formula incompatibility (permanent blacklist)
// or release a hold (user error — formula is restored).

import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { incrementAdverseCount } from '@/lib/intelligence/updateAdversePatterns'

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { concern_id, action, admin_clinical_note } = await request.json()

    if (!concern_id || !action) {
      return NextResponse.json({ error: 'Missing concern_id or action' }, { status: 400 })
    }

    if (!['confirm', 'release'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be confirm or release.' }, { status: 400 })
    }

    // Release requires a mandatory clinical note
    if (action === 'release' && (!admin_clinical_note || admin_clinical_note.trim().length < 10)) {
      return NextResponse.json({ error: 'A clinical note is required to release a hold (minimum 10 characters).' }, { status: 400 })
    }

    const review_status = action === 'confirm'
      ? 'confirmed_incompatibility'
      : 'released_protocol_failure'

    // Update the concern report with the admin's decision
    const { error: updateError } = await adminClient
      .from('concern_reports')
      .update({
        review_status,
        admin_clinical_note: admin_clinical_note?.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', concern_id)

    if (updateError) {
      console.error('concern-review update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Phase C: If confirmed incompatibility, increment the High-Risk Mirror adverse count
    if (action === 'confirm') {
      try {
        const { data: concern } = await adminClient
          .from('concern_reports')
          .select('user_id, formula_code')
          .eq('id', concern_id)
          .single()

        if (concern?.user_id && concern?.formula_code) {
          const { data: latestAssessment } = await adminClient
            .from('skin_assessments')
            .select('skin_type, fitzpatrick_estimate, primary_concern')
            .eq('user_id', concern.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (latestAssessment) {
            const profileObj = {
              skin_type: latestAssessment.skin_type || 'unknown',
              fitzpatrick_estimate: latestAssessment.fitzpatrick_estimate || 'unknown',
              primary_concern: latestAssessment.primary_concern || 'unknown'
            }
            await incrementAdverseCount(concern.formula_code, profileObj)
          }
        }
      } catch (err) {
        console.error('Failed to increment adverse count for High-Risk Mirror:', err)
      }
    }

    // Task C: Auto-clear the assessment flag now that a governance decision has been made.
    // Both 'confirm' and 'release' mean the admin has reviewed this — the flag's job is done.
    // Chemist-level flags (2+ adverse reports) are preserved — they require a separate manual sign-off.
    try {
      const { data: concern } = await adminClient
        .from('concern_reports')
        .select('user_id')
        .eq('id', concern_id)
        .single()

      if (concern?.user_id) {
        const { data: latestAssessment } = await adminClient
          .from('skin_assessments')
          .select('id, flag_reason')
          .eq('user_id', concern.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const requiresChemist = latestAssessment?.flag_reason?.includes('Chemist review required') ?? false
        if (!requiresChemist && latestAssessment?.id) {
          await adminClient
            .from('skin_assessments')
            .update({ is_flagged_for_review: false })
            .eq('id', latestAssessment.id)
        }
      }
    } catch (flagErr) {
      // Non-fatal — governance decision is already saved above
      console.error('Task C: auto-clear flag error (non-fatal):', flagErr)
    }

    return NextResponse.json({ success: true, review_status })

  } catch (err: any) {
    console.error('concern-review error:', err)
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
