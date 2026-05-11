import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { user_id, chemist_notes, new_blacklisted_formula } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 1. Clear the flag on the user's latest assessment
    const { data: assessments, error: fetchError } = await adminClient
      .from('skin_assessments')
      .select('id, adverse_formula_history')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError || !assessments || assessments.length === 0) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    const latestAssessment = assessments[0]
    const currentBlacklist = Array.isArray(latestAssessment.adverse_formula_history) 
      ? latestAssessment.adverse_formula_history 
      : []

    // 2. Add to blacklist if provided
    let newBlacklist = [...currentBlacklist]
    if (new_blacklisted_formula && !newBlacklist.includes(new_blacklisted_formula)) {
      newBlacklist.push(new_blacklisted_formula)
    }

    // Update the assessment
    const { error: updateAssmntError } = await adminClient
      .from('skin_assessments')
      .update({
        is_flagged_for_review: false,
        flag_reason: null,
        adverse_formula_history: newBlacklist
      })
      .eq('id', latestAssessment.id)

    if (updateAssmntError) throw updateAssmntError

    // 3. Append to Chemist Notes on Profile
    if (chemist_notes) {
      // First, fetch current notes
      const { data: profile } = await adminClient
        .from('profiles')
        .select('chemist_notes')
        .eq('id', user_id)
        .single()

      const existingNotes = profile?.chemist_notes ? profile.chemist_notes + '\n\n' : ''
      const timestamp = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      const appendedNotes = `${existingNotes}[${timestamp} - Chemist Review]\n${chemist_notes}`

      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ chemist_notes: appendedNotes })
        .eq('id', user_id)

      if (profileError) throw profileError
    }

    // 4. Resolve the open concern report automatically if it exists
    const { data: openReports } = await adminClient
      .from('concern_reports')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'open')

    if (openReports && openReports.length > 0) {
      for (const report of openReports) {
        await adminClient
          .from('concern_reports')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            admin_notes: chemist_notes ? `Resolved by Chemist: ${chemist_notes}` : 'Resolved by Chemist'
          })
          .eq('id', report.id)
      }
    }

    return NextResponse.json({ success: true, new_blacklist: newBlacklist })

  } catch (error: any) {
    console.error('Chemist review error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
