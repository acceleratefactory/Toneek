// src/app/api/report-concern/list/route.ts
// Returns concern reports for the admin panel with customer profiles attached.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const tab = request.nextUrl.searchParams.get('tab') ?? 'open'

  const query = adminClient
    .from('concern_reports')
    .select('id, user_id, formula_code, suspected_product, severity, description, day_of_protocol, photo_url, status, admin_notes, submitted_at, resolved_at')
    .order('submitted_at', { ascending: false })

  if (tab === 'open')     query.eq('status', 'open')
  if (tab === 'resolved') query.eq('status', 'resolved')

  const { data: reports, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!reports || reports.length === 0) return NextResponse.json({ reports: [] })

  // Fetch profiles separately — avoids FK constraint name dependency
  const userIds = [...new Set(reports.map((r: any) => r.user_id).filter(Boolean))]
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', userIds)

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))

  // Fetch total concern reports count for these users
  const { data: allUserReports } = await adminClient
    .from('concern_reports')
    .select('user_id')
    .in('user_id', userIds)

  const reportCounts: Record<string, number> = {}
  allUserReports?.forEach((r: any) => {
    if (r.user_id) reportCounts[r.user_id] = (reportCounts[r.user_id] || 0) + 1
  })

  // Fetch skin_assessments to get adverse_formula_history and fallback formula_codes
  const { data: assessments } = await adminClient
    .from('skin_assessments')
    .select('user_id, formula_code, adverse_formula_history')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })

  const userMeta: Record<string, any> = {}
  ;(assessments ?? []).forEach((a: any) => {
    if (a.user_id && !userMeta[a.user_id]) {
      userMeta[a.user_id] = {
        formula_code: a.formula_code,
        adverse_formula_history: Array.isArray(a.adverse_formula_history) ? a.adverse_formula_history : []
      }
    }
  })

  const enriched = reports.map((r: any) => ({
    ...r,
    formula_code: (r.formula_code && r.formula_code !== 'N/A')
      ? r.formula_code
      : (userMeta[r.user_id]?.formula_code ?? null),
    profile: profileMap[r.user_id] ?? null,
    total_reports_count: reportCounts[r.user_id] || 1,
    adverse_formula_history: userMeta[r.user_id]?.adverse_formula_history || [],
  }))

  // Phase F: Fetch system-level formula flags (chemist review required)
  const { data: systemFlags } = await adminClient
    .from('rule_performance')
    .select('*')
    .eq('flag', 'concentration_review_required')
    .order('updated_at', { ascending: false })

  return NextResponse.json({ reports: enriched, systemFlags: systemFlags ?? [] })
}
