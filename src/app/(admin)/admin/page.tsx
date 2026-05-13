import { adminClient } from '@/lib/supabase/admin'
import DashboardCharts from '@/components/admin/DashboardCharts'

// Force the page to dynamically render
export const dynamic = 'force-dynamic'

async function getSystemHealth() {
  const [
    { count: totalSubscribers },
    { count: activeSubscribers },
    { data: pendingPayments },
    { data: pendingProduction },
    { data: recentOutcomes },
    { count: flaggedAssessments },
    { data: allOrders },
    { data: allSubscriptions },
    { data: openConcernReports },
    { data: systemFlags },
  ] = await Promise.all([
    adminClient.from('subscriptions').select('*', { count: 'exact', head: true }),
    adminClient.from('subscriptions').select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    adminClient.from('orders')
      .select('id, payment_reference, payment_amount, currency, plan_tier, customer_claimed_sent_at, payment_confirm_token, user_id')
      .eq('payment_status', 'pending_verification')
      .order('customer_claimed_sent_at', { ascending: true }),
    adminClient.from('production_queue')
      .select('*')
      .in('status', ['pending', 'in_production'])
      .order('production_date', { ascending: true }),
    adminClient.from('skin_outcomes')
      .select('user_id, check_in_week, improvement_score, adverse_reactions, recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(10),
    adminClient.from('skin_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('is_flagged_for_review', true),
    adminClient.from('orders')
      .select('created_at, payment_amount, plan_tier, status')
      .neq('status', 'cancelled'),
    adminClient.from('subscriptions')
      .select('created_at, status'),
    adminClient.from('concern_reports')
      .select('id, user_id, severity, description, day_of_protocol, formula_code, submitted_at')
      .eq('status', 'open')
      .order('submitted_at', { ascending: false })
      .limit(5),
    adminClient.from('rule_performance')
      .select('*')
      .eq('flag', 'concentration_review_required')
      .order('updated_at', { ascending: false }),
  ])

  // Process historical data for interactive charts
  const historicalOrders = Array.isArray(allOrders) ? allOrders : []
  const historicalSubscriptions = Array.isArray(allSubscriptions) ? allSubscriptions : []
  
  // Need to fetch profile names for pending payments manually because sometimes orders 
  // are created successfully but FK joins might be tricky if user hasn't fully logged in yet.
  const paymentsWithProfiles = await Promise.all((pendingPayments ?? []).map(async (order: any) => {
    let name = 'Unknown Customer'
    if (order.user_id) {
       const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', order.user_id).single()
       if (profile?.full_name) name = profile.full_name
    }
    return { ...order, customer_name: name }
  }))

  // Fetch profile names for open concern reports separately
  const rawConcernReports = openConcernReports ?? []
  let concernReportsWithProfiles: any[] = []
  if (rawConcernReports.length > 0) {
    const userIds = [...new Set(rawConcernReports.map((r: any) => r.user_id).filter(Boolean))]
    const { data: crProfiles } = await adminClient.from('profiles').select('id, full_name').in('id', userIds)
    const crProfileMap = Object.fromEntries((crProfiles ?? []).map((p: any) => [p.id, p]))
    concernReportsWithProfiles = rawConcernReports.map((r: any) => ({ ...r, profile: crProfileMap[r.user_id] ?? null }))
  }

  // 1. Fetch Confirmed High-Risk Reporters (Phase I: only confirmed_incompatibility, excludes released holds)
  // Count DISTINCT customers — one customer with multiple confirmed concerns counts as 1.
  const { data: confirmedReporters } = await adminClient
    .from('concern_reports')
    .select('user_id')
    .eq('review_status', 'confirmed_incompatibility')

  const highRiskReporters = new Set(confirmedReporters?.map((r: any) => r.user_id) ?? []).size

  // 1b. Fetch Pending Clinical Reviews (Phase I: concerns awaiting admin decision)
  const { count: pendingClinicalReviews } = await adminClient
    .from('concern_reports')
    .select('*', { count: 'exact', head: true })
    .eq('review_status', 'pending_review')

  // 2. Fetch Stagnant Check-ins (Last 30 days, score < 4, no adverse)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: stagnantCheckins } = await adminClient
    .from('skin_outcomes')
    .select('*', { count: 'exact', head: true })
    .lt('improvement_score', 4)
    .eq('adverse_reactions', false)
    .gte('recorded_at', thirtyDaysAgo.toISOString())

  // 3. Calculate Production Mismatches
  let productionMismatches = 0
  if (pendingProduction && pendingProduction.length > 0) {
    for (const run of pendingProduction) {
      const isObject = !Array.isArray(run.batches) && run.batches !== null
      const formulaBatches = isObject ? run.batches.formula_batches || [] : run.batches || []
      const orderIds = formulaBatches.flatMap((b: any) => b.order_ids ?? [])
      
      if (orderIds.length > 0) {
        const { data: runOrders } = await adminClient.from('orders').select('user_id, formula_code').in('id', orderIds)
        if (runOrders) {
           for (const order of runOrders) {
             const { data: latestAssessment } = await adminClient
               .from('skin_assessments')
               .select('formula_code')
               .eq('user_id', order.user_id)
               .order('created_at', { ascending: false })
               .limit(1)
               .maybeSingle()
             
             if (latestAssessment && latestAssessment.formula_code !== order.formula_code) {
               productionMismatches++
             }
           }
        }
      }
    }
  }

  return {
    totalSubscribers: totalSubscribers ?? 0,
    activeSubscribers: activeSubscribers ?? 0,
    pendingPayments: paymentsWithProfiles,
    pendingProduction: pendingProduction ?? [],
    recentOutcomes: recentOutcomes ?? [],
    flaggedAssessments: flaggedAssessments ?? 0,
    historicalOrders,
    historicalSubscriptions,
    openConcernReports: concernReportsWithProfiles,
    systemFlags: systemFlags ?? [],
    highRiskReporters: highRiskReporters ?? 0,
    pendingClinicalReviews: pendingClinicalReviews ?? 0,
    stagnantCheckins: stagnantCheckins ?? 0,
    productionMismatches
  }
}

export default async function AdminDashboardPage() {
  const data = await getSystemHealth()
  const totalTasks = data.pendingPayments.length + data.flaggedAssessments + data.pendingProduction.length
  
  // Safe math for styling widths safely to prevent NaN values if 0
  const activePct = data.totalSubscribers > 0 ? (data.activeSubscribers / data.totalSubscribers) * 100 : 0
  const inactivePct = data.totalSubscribers > 0 ? ((data.totalSubscribers - data.activeSubscribers) / data.totalSubscribers) * 100 : 0

  return (
    <div className="space-y-6 text-gray-800">
      
      {/* â”€â”€ Top Header Banner (Zoho Style) â”€â”€ */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-toneek-cream border border-toneek-lightgray text-toneek-brown rounded flex items-center justify-center font-bold text-xl shadow-sm">
            TA
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hello, Administrator</h1>
            <p className="text-sm text-gray-500 mt-1">Toneek System Health & Operations</p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Row 1: KPI Overview Cards (Zoho Receivables Style) â”€â”€ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Subscription Overview Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">Subscription Overview</h2>
            <span className="text-toneek-brown text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline bg-toneek-cream px-2 py-1 rounded">
              <span className="text-lg leading-none">+</span> New
            </span>
          </div>
          <div className="p-6 pb-8">
            <p className="text-xs text-gray-500 mb-1 uppercase font-medium tracking-wide">Total Subscriptions</p>
            <p className="text-4xl font-light text-gray-900 mb-8">{data.totalSubscribers}</p>
            
            <div className="h-3 w-full flex rounded-full overflow-hidden mb-4 bg-gray-100">
               {data.totalSubscribers === 0 && <div className="bg-gray-200 w-full h-full"></div>}
                {data.totalSubscribers > 0 && (
                 <>
                   <div className="bg-toneek-forest h-full" style={{ width: `${activePct}%` }}></div>
                   <div className="bg-toneek-gray h-full" style={{ width: `${inactivePct}%` }}></div>
                 </>
               )}
            </div>
            
            <div className="flex gap-8 items-center mt-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-toneek-forest"></div>
                <span className="text-sm text-gray-500">Active : <b className="text-gray-800 ml-1">{data.activeSubscribers}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-toneek-gray"></div>
                <span className="text-sm text-gray-500">Inactive : <b className="text-gray-800 ml-1">{data.totalSubscribers - data.activeSubscribers}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Signal Center Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Active Signal Center
            </h2>
          </div>
          <div className="p-0 flex flex-col justify-center flex-1 divide-y divide-gray-100">
            {/* Phase I: Pending Clinical Review — highest priority, needs action first */}
            <a href="/admin/customers" className="flex items-center justify-between p-4 hover:bg-amber-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 text-amber-700 p-2 rounded-lg text-lg">â³</div>
                <div>
                  <p className="font-bold text-sm text-gray-900 group-hover:text-amber-700">Pending Clinical Review</p>
                  <p className="text-xs text-gray-500">Concern holds awaiting admin decision</p>
                </div>
              </div>
              <span className={`font-black text-lg ${data.pendingClinicalReviews > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                {data.pendingClinicalReviews}
              </span>
            </a>

            <a href="/admin/production" className="flex items-center justify-between p-4 hover:bg-red-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 text-red-600 p-2 rounded-lg text-lg">🚨</div>
                <div>
                  <p className="font-bold text-sm text-gray-900 group-hover:text-red-700">Production Mismatches</p>
                  <p className="text-xs text-gray-500">Formula changes pending in active run</p>
                </div>
              </div>
              <span className={`font-black text-lg ${data.productionMismatches > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {data.productionMismatches}
              </span>
            </a>

            <a href="/admin" className="flex items-center justify-between p-4 hover:bg-amber-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 text-amber-600 p-2 rounded-lg text-lg">⚠ï¸</div>
                <div>
                  <p className="font-bold text-sm text-gray-900 group-hover:text-amber-700">Stagnant Check-ins</p>
                  <p className="text-xs text-gray-500">Recent check-in scores &lt; 4</p>
                </div>
              </div>
              <span className={`font-black text-lg ${data.stagnantCheckins > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                {data.stagnantCheckins}
              </span>
            </a>

            {/* Phase I: Only confirmed_incompatibility — excludes released protocol failures */}
            <a href="/admin/concern-reports" className="flex items-center justify-between p-4 hover:bg-toneek-cream transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-toneek-brown/10 text-toneek-brown p-2 rounded-lg text-lg">🔁</div>
                <div>
                  <p className="font-bold text-sm text-gray-900 group-hover:text-toneek-brown">Confirmed High-Risk</p>
                  <p className="text-xs text-gray-500">Verified formula incompatibilities</p>
                </div>
              </div>
              <span className={`font-black text-lg ${data.highRiskReporters > 0 ? 'text-toneek-brown' : 'text-gray-400'}`}>
                {data.highRiskReporters}
              </span>
            </a>
          </div>
        </div>

      </div>

      {/* â”€â”€ Interactive Historical Charts Canvas â”€â”€ */}
      <DashboardCharts 
         historicalOrders={data.historicalOrders} 
         historicalSubscriptions={data.historicalSubscriptions}
         totalSubscribers={data.totalSubscribers}
      />

      {/* â”€â”€ Row 2: Data Grids (Zoho Lists Style) â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Payments Grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[350px]">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">Payments Awaiting Confirmation</h2>
          </div>
          <div className="p-0 overflow-auto flex-1">
            {data.pendingPayments.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6">
                <p className="text-gray-400 text-sm mb-2">No payments awaiting confirmation</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 tracking-wide uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.pendingPayments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-toneek-brown">{payment.customer_name}</p>
                        <p className="text-xs text-toneek-gray mt-0.5 font-mono">{payment.payment_reference}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{payment.currency} {payment.payment_amount}</p>
                        <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">{new Date(payment.customer_claimed_sent_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/api/payments/admin-confirm?order_id=${payment.id}&token=${payment.payment_confirm_token}`}
                          className="inline-block bg-toneek-forest hover:bg-[#144229] text-white text-xs font-medium px-4 py-2 rounded shadow-sm transition-colors"
                        >
                          Confirm
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Production Queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[350px]">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">Production Queue</h2>
            <span className="text-gray-400 text-xs font-medium cursor-pointer hover:text-gray-600">Active Runs â–¾</span>
          </div>
          <div className="p-0 overflow-auto flex-1">
            {data.pendingProduction.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6">
                <p className="text-gray-400 text-sm mb-2">No active production runs</p>
                <a href="/admin/production" className="text-toneek-brown text-sm hover:underline">View queued formulas</a>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {data.pendingProduction.map((run: any) => (
                  <li key={run.id} className="p-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                    <div>
                      <p className="font-bold text-toneek-brown text-sm font-mono">Run Core: {new Date(run.production_date).toLocaleDateString()}</p>
                      <div className="flex gap-4 mt-2">
                        <p className="text-xs text-gray-500">Status: <span className="uppercase font-semibold text-toneek-alert">{run.status}</span></p>
                        <p className="text-xs text-gray-500">Units: <span className="font-bold text-gray-700">{run.total_orders_covered}</span></p>
                      </div>
                    </div>
                    <a href="/admin/production" className="text-toneek-brown text-sm hover:underline font-medium">Manage →</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
      </div>

      {/* â”€â”€ Concern Reports Card â”€â”€ */}
      <a
        href="/admin/concern-reports"
        className={`block bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
          data.openConcernReports.length > 0 ? 'border-red-300' : 'border-gray-100'
        }`}
      >
        <div className={`px-6 py-4 flex items-center justify-between ${
          data.openConcernReports.length > 0 ? 'bg-red-50' : 'bg-gray-50/50'
        } border-b ${
          data.openConcernReports.length > 0 ? 'border-red-100' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠</span>
            <h2 className="text-sm font-bold text-gray-800">Concern Reports</h2>
            {data.openConcernReports.length > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                {data.openConcernReports.length} open
              </span>
            )}
          </div>
          <span className="text-xs text-red-600 font-semibold hover:underline">
            View all →
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {data.openConcernReports.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">✅ No open concern reports</p>
            </div>
          ) : (
            data.openConcernReports.map((report: any) => {
              const severityColor =
                report.severity === 'severe'   ? 'bg-red-100 text-red-800 border-red-200' :
                report.severity === 'moderate' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                 'bg-yellow-100 text-yellow-800 border-yellow-200'
              return (
                <div key={report.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-red-50/30 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`flex-shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-bold border ${severityColor}`}>
                      {report.severity}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {(report.profile as any)?.full_name ?? 'Unknown'}
                        <span className="font-normal text-gray-400 ml-2 text-xs">{report.formula_code ?? ''}</span>
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">"{report.description}"</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">
                      {report.day_of_protocol ? `Day ${report.day_of_protocol}` : '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(report.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </a>

      {/* â”€â”€ Row 3: Outcomes & Alerts (Preserving Functionality) â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Recent Outcomes Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[300px]">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">Recent Customer Outcomes</h2>
            <a href="/admin/outcomes" className="text-toneek-brown text-xs font-medium hover:underline">View All</a>
          </div>
          <div className="p-6 overflow-auto flex-1 bg-gray-50/20">
            {data.recentOutcomes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                 <p className="text-gray-400 text-sm">No recent clinical check-ins logged.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.recentOutcomes.map((outcome: any, idx: number) => {
                   const hasAdverse = outcome.adverse_reactions === true
                   const badScore = outcome.improvement_score && outcome.improvement_score < 4
                   let borderColor = 'border-gray-200 bg-white'
                   if (hasAdverse) borderColor = 'border-toneek-errorbg bg-[#FDECEA]'
                   else if (badScore) borderColor = 'border-toneek-alertbg bg-[#FEF3E2]'

                   return (
                     <div key={idx} className={`p-4 rounded-lg border shadow-sm ${borderColor}`}>
                       <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Week {outcome.check_in_week}</p>
                       <div className="mt-2 flex items-baseline gap-2">
                         <span className="text-2xl font-bold text-gray-900">{outcome.improvement_score ? outcome.improvement_score : '—'}</span>
                         <span className="text-sm font-medium text-gray-400">/ 10</span>
                       </div>
                       {hasAdverse && <p className="text-xs font-semibold text-toneek-error mt-2 flex items-center bg-white w-max px-2 py-0.5 rounded shadow-sm border border-toneek-errorbg">⚠ï¸ Adverse Reaction</p>}
                       <p className="text-xs text-gray-400 mt-3">{new Date(outcome.recorded_at).toLocaleDateString()}</p>
                     </div>
                   )
                })}
              </div>
            )}
          </div>
        </div>

        {/* System Alerts Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[300px]">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">System Activity & Alerts</h2>
          </div>
          <div className="p-6 overflow-auto flex-1 space-y-4">
            
            {/* Global Chemist Flags */}
            {data.systemFlags.length > 0 && (
               <div className="bg-red-900 border-l-4 border-red-500 p-4 rounded text-white shadow-sm">
                 <div className="flex">
                    <span className="font-bold mr-2 text-lg">🚨</span>
                    <div>
                       <h3 className="font-bold border-b border-red-500/30 pb-1">Global Chemist Review</h3>
                       {data.systemFlags.map((flag: any) => (
                         <p key={flag.id} className="text-sm mt-2">
                           Formula <strong>{flag.formula_code}</strong> has {flag.adverse_report_count} adverse reports. Concentration review required.
                         </p>
                       ))}
                       <a href="/admin/concern-reports" className="inline-block mt-3 bg-white px-3 py-1.5 text-xs font-bold border border-red-900 rounded shadow-sm hover:bg-gray-100 transition-colors text-red-900">Go to Concern Reports</a>
                    </div>
                 </div>
               </div>
            )}

            {/* Individual Assessment Flags */}
            {data.flaggedAssessments > 0 && (
               <div className="bg-toneek-errorbg border-l-4 border-toneek-error p-4 rounded text-toneek-error">
                 <div className="flex">
                    <span className="font-bold mr-2 text-lg">⚠ï¸</span>
                    <div>
                      <h3 className="font-bold border-b border-toneek-error/10 pb-1">Customer Review Required</h3>
                       <p className="text-sm mt-1">{data.flaggedAssessments} assessments are automatically flagged for potential medical contraindications or individual chemist review.</p>
                       <a href="/admin/customers" className="inline-block mt-3 bg-white px-3 py-1.5 text-xs font-bold border border-toneek-errorbg rounded shadow-sm hover:bg-gray-50 transition-colors text-toneek-error">Review Customers</a>
                    </div>
                 </div>
               </div>
            )}

            {/* Empty State */}
            {data.flaggedAssessments === 0 && data.systemFlags.length === 0 && (
               <div className="h-full flex items-center justify-center">
                 <div className="text-center text-gray-400">
                    <p className="mb-2 text-3xl">✓</p>
                    <p className="text-sm font-medium">All systems nominally operating.</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

