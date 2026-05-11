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

  // For reports where formula_code was not saved (null or 'N/A'), look it up from skin_assessments
  const missingFormulaUserIds = reports
    .filter((r: any) => !r.formula_code || r.formula_code === 'N/A')
    .map((r: any) => r.user_id)
    .filter(Boolean)

  const formulaFallbackMap: Record<string, string> = {}
  if (missingFormulaUserIds.length > 0) {
    const { data: assessments } = await adminClient
      .from('skin_assessments')
      .select('user_id, formula_code')
      .in('user_id', missingFormulaUserIds)
      .not('formula_code', 'is', null)
      .order('created_at', { ascending: false })

    // Keep only the most recent assessment per user
    ;(assessments ?? []).forEach((a: any) => {
      if (a.user_id && a.formula_code && !formulaFallbackMap[a.user_id]) {
        formulaFallbackMap[a.user_id] = a.formula_code
      }
    })
  }

  const enriched = reports.map((r: any) => ({
    ...r,
    formula_code: (r.formula_code && r.formula_code !== 'N/A')
      ? r.formula_code
      : (formulaFallbackMap[r.user_id] ?? null),
    profile: profileMap[r.user_id] ?? null,
  }))

  return NextResponse.json({ reports: enriched })
}
