import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getAnalyticsData() {
  const [
    { data: assessments },
    { data: concernReports },  // Phase I Task E: now includes review_status
    { data: outcomes },
    { data: rulePerformance }
  ] = await Promise.all([
    adminClient.from('skin_assessments').select('user_id, formula_code'),
    adminClient.from('concern_reports').select('formula_code, severity, review_status'),
    adminClient.from('skin_outcomes').select('user_id, improvement_score, adverse_reactions'),
    adminClient.from('rule_performance').select('*')
  ])

  // Build a map of user_id -> latest formula_code from assessments
  const userFormulaMap: Record<string, string> = {}
  assessments?.forEach((a: any) => {
    if (a.user_id && a.formula_code) {
      userFormulaMap[a.user_id] = a.formula_code
    }
  })

  // Initialize stats per formula
  const formulaStats: Record<string, any> = {}

  // Count total assignments per formula
  assessments?.forEach((a: any) => {
    const code = a.formula_code
    if (!code) return
    if (!formulaStats[code]) {
      formulaStats[code] = {
        assigned: 0,
        confirmedAdverse: 0,   // Phase I: only confirmed_incompatibility
        protocolFailures: 0,   // Phase I: released_protocol_failure (user error)
        pendingReview: 0,      // Phase I: awaiting admin decision
        success: 0,
        totalOutcomes: 0
      }
    }
    formulaStats[code].assigned++
  })

  // Phase I Task E: Separate concern reports by review_status
  // True Adverse = confirmed_incompatibility only
  // Protocol Failure = released_protocol_failure (user error, not formula fault)
  // Pending = pending_review (awaiting admin decision)
  // Fix: if a concern's formula_code is valid but not yet in formulaStats,
  // initialise it so the KPI and table are always consistent.
  concernReports?.forEach((c: any) => {
    const code = c.formula_code
    if (!code || code === 'N/A') return   // skip blank / fallback codes
    if (!formulaStats[code]) {
      formulaStats[code] = {
        assigned: 0,
        confirmedAdverse: 0,
        protocolFailures: 0,
        pendingReview: 0,
        success: 0,
        totalOutcomes: 0
      }
    }
    if (c.review_status === 'confirmed_incompatibility') {
      formulaStats[code].confirmedAdverse++
    } else if (c.review_status === 'released_protocol_failure') {
      formulaStats[code].protocolFailures++
    } else {
      formulaStats[code].pendingReview++
    }
  })

  // Link check-in outcomes to formulas via user_id and calculate success
  outcomes?.forEach((o: any) => {
    const code = userFormulaMap[o.user_id]
    if (!code || !formulaStats[code]) return
    formulaStats[code].totalOutcomes++
    if ((o.improvement_score ?? 0) >= 7) {
      formulaStats[code].success++
    }
    // Task A fix: adverse_reactions from skin_outcomes are NOT added to confirmedAdverse.
    // concern_reports (with review_status='confirmed_incompatibility') is the single source
    // of truth for confirmed adverse counts. Adding skin_outcomes here caused a double-count
    // because every concern submission auto-creates a skin_outcomes row with adverse_reactions=true,
    // regardless of whether the concern was confirmed, released, or still pending.
  })

  const analytics = Object.entries(formulaStats).map(([code, stats]) => {
    // True Adverse Rate — only confirmed incompatibilities (clean clinical data)
    const trueAdverseRate = stats.assigned > 0
      ? ((stats.confirmedAdverse / stats.assigned) * 100).toFixed(1)
      : '0.0'
    // Protocol Failure Rate — user errors (useful for improving onboarding instructions)
    const protocolFailureRate = stats.assigned > 0
      ? ((stats.protocolFailures / stats.assigned) * 100).toFixed(1)
      : '0.0'
    const successRate = stats.totalOutcomes > 0
      ? ((stats.success / stats.totalOutcomes) * 100).toFixed(1)
      : 'N/A'
    return {
      formula_code: code,
      assigned: stats.assigned,
      confirmedAdverse: stats.confirmedAdverse,
      protocolFailures: stats.protocolFailures,
      pendingReview: stats.pendingReview,
      success: stats.success,
      totalOutcomes: stats.totalOutcomes,
      trueAdverseRate: parseFloat(trueAdverseRate),
      protocolFailureRate: parseFloat(protocolFailureRate),
      successRate
    }
  }).sort((a, b) => b.assigned - a.assigned)

  // Global totals — use formulaStats sums so KPI matches table exactly
  const totalConfirmedAdverse = Object.values(formulaStats).reduce((sum: number, s: any) => sum + s.confirmedAdverse, 0)
  const totalProtocolFailures = Object.values(formulaStats).reduce((sum: number, s: any) => sum + s.protocolFailures, 0)
  const totalPendingReviews   = concernReports?.filter((c: any) => c.review_status === 'pending_review').length ?? 0

  return {
    analytics,
    rulePerformance: rulePerformance || [],
    totalAssessments: assessments?.length || 0,
    totalConfirmedAdverse,
    totalProtocolFailures,
    totalPendingReviews,
    totalOutcomes: outcomes?.length || 0
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()

  return (
    <div className="space-y-6 text-gray-800">

      {/* ── Top Header Banner ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative pb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-toneek-cream border border-toneek-lightgray text-toneek-brown rounded flex items-center justify-center font-bold shadow-sm text-xl">
            📈
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Population Health Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Global formula performance and system macro-intelligence</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── KPI Overview column ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Total Prescriptions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Prescriptions</h2>
            <p className="text-4xl font-black text-gray-900">{data.totalAssessments}</p>
            <p className="text-xs text-gray-500 mt-2">Across all global regions</p>
          </div>

          {/* Phase I Task E: True Confirmed Adverse Reports (excludes user errors) */}
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6" style={{ background: 'rgba(254,242,242,0.3)' }}>
            <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2">Confirmed Adverse Reports</h2>
            <p className="text-4xl font-black text-red-700">{data.totalConfirmedAdverse}</p>
            <p className="text-xs text-red-400 mt-2">Verified formula incompatibilities only</p>
          </div>

          {/* Phase I Task E: Protocol Failures (user error — NOT formula fault) */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-6" style={{ background: 'rgba(255,251,235,0.4)' }}>
            <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-2">Protocol Failures</h2>
            <p className="text-4xl font-black text-amber-700">{data.totalProtocolFailures}</p>
            <p className="text-xs text-amber-500 mt-2">Admin-confirmed user errors — not formula faults</p>
          </div>

          {/* Phase I Task E: Pending Reviews — prompts admin to clear unresolved holds */}
          {data.totalPendingReviews > 0 && (
            <div className="bg-white rounded-xl border border-amber-300 shadow-sm p-6" style={{ background: 'rgba(255,251,235,0.6)' }}>
              <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>⏳</span> Pending Clinical Reviews
              </h2>
              <p className="text-4xl font-black text-amber-800">{data.totalPendingReviews}</p>
              <p className="text-xs text-amber-600 mt-2">Concerns awaiting admin decision — adverse rates may be overstated until resolved</p>
            </div>
          )}

          {/* Total Check-in Outcomes */}
          <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6" style={{ background: 'rgba(240,253,244,0.3)' }}>
            <h2 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-2">Total Check-in Outcomes</h2>
            <p className="text-4xl font-black text-green-700">{data.totalOutcomes}</p>
            <p className="text-xs text-green-500 mt-2">Completed routine progress checks</p>
          </div>

          {/* Master Chemist Flags */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span>🔬</span> Master Chemist Flags
              </h2>
            </div>
            <div className="p-0">
              {data.rulePerformance.filter((r: any) => r.flag === 'concentration_review_required').length === 0 ? (
                <div className="p-6 text-sm text-gray-500 text-center">No global formulas require lab review.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.rulePerformance
                    .filter((r: any) => r.flag === 'concentration_review_required')
                    .map((rule: any) => (
                      <li key={rule.id} className="p-4 bg-red-50">
                        <p className="font-mono font-bold text-red-700">{rule.formula_code}</p>
                        <p className="text-xs text-red-600 mt-1">Exceeded confirmed adverse threshold. Concentration review required.</p>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

        </div>

        {/* ── Formula Performance Matrix ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Formula Performance Matrix</h2>
              <span className="text-xs font-bold text-toneek-brown bg-toneek-cream px-2 py-1 rounded">All Climates · Global</span>
            </div>
            <div className="p-0 flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Formula Code</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned</th>
                    {/* Phase I Task E: Renamed to Confirmed Adverse */}
                    <th className="px-4 py-4 text-center text-xs font-semibold text-red-500 uppercase tracking-wide">Confirmed Adverse</th>
                    {/* Phase I Task E: New Protocol Failures column */}
                    <th className="px-4 py-4 text-center text-xs font-semibold text-amber-500 uppercase tracking-wide">Protocol Failures</th>
                    <th className="px-4 py-4 text-center text-xs font-semibold text-green-600 uppercase tracking-wide">Success Rate</th>
                    {/* Phase I Task E: Renamed to True Adverse Rate */}
                    <th className="px-4 py-4 text-right text-xs font-semibold text-red-500 uppercase tracking-wide">True Adverse Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.analytics.map((item) => (
                    <tr key={item.formula_code} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                        {item.formula_code}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 text-center font-medium">
                        {item.assigned}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${item.confirmedAdverse > 0 ? 'bg-red-100 text-red-700' : 'text-gray-400'}`}>
                          {item.confirmedAdverse}
                        </span>
                      </td>
                      {/* Phase I: Protocol Failures — amber, not red (user error) */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${item.protocolFailures > 0 ? 'bg-amber-100 text-amber-700' : 'text-gray-400'}`}>
                          {item.protocolFailures}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold">
                        {item.successRate === 'N/A' ? (
                          <span className="text-gray-400">—</span>
                        ) : parseFloat(item.successRate) >= 70 ? (
                          <span className="text-green-600">{item.successRate}%</span>
                        ) : (
                          <span className="text-amber-600">{item.successRate}%</span>
                        )}
                      </td>
                      {/* Phase I: True Adverse Rate — only confirmed incompatibilities */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold">
                        <span className={item.trueAdverseRate > 5 ? 'text-red-600' : 'text-green-600'}>
                          {item.trueAdverseRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.analytics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No formula performance data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
