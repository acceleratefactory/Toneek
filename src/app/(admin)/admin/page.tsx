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

  return {
    totalSubscribers: totalSubscribers ?? 0,
    activeSubscribers: activeSubscribers ?? 0,
    pendingPayments: paymentsWithProfiles,
    pendingProduction: pendingProduction ?? [],
    recentOutcomes: recentOutcomes ?? [],
    flaggedAssessments: flaggedAssessments ?? 0,
    historicalOrders,
    historicalSubscriptions
  }
}

export default async function AdminDashboardPage() {
  const data = await getSystemHealth()
  const totalTasks = data.pendingPayments.length + data.flaggedAssessments + data.pendingProduction.length
  
  // Safe math for styling widths safely to prevent NaN values if 0
  const activePct = data.totalSubscribers > 0 ? (data.activeSubscribers / data.totalSubscribers) * 100 : 0
  const inactivePct = data.totalSubscribers > 0 ? ((data.totalSubscribers - data.activeSubscribers) / data.totalSubscribers) * 100 : 0
  
  const payPct = totalTasks > 0 ? (data.pendingPayments.length / totalTasks) * 100 : 0
  const flagPct = totalTasks > 0 ? (data.flaggedAssessments / totalTasks) * 100 : 0
  const prodPct = totalTasks > 0 ? (data.pendingProduction.length / totalTasks) * 100 : 0

  return (
    <div className="space-y-6 text-gray-800">
      
      {/* ── Top Header Banner (Zoho Style) ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-[#b8895a]/10 border border-[#b8895a]/20 text-[#b8895a] rounded flex items-center justify-center font-bold text-xl shadow-sm">
            TA
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hello, Administrator</h1>
            <p className="text-sm text-gray-500 mt-1">Toneek System Health & Operations</p>
          </div>
        </div>
      </div>

      {/* ── Row 1: KPI Overview Cards (Zoho Receivables Style) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Subscription Overview Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">Subscription Overview</h2>
            <span className="text-blue-600 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline bg-blue-50 px-2 py-1 rounded">
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
                   <div className="bg-[#1e88e5] h-full" style={{ width: `${activePct}%` }}></div>
                   <div className="bg-[#fb8c00] h-full" style={{ width: `${inactivePct}%` }}></div>
                 </>
               )}
            </div>
            
            <div className="flex gap-8 items-center mt-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#1e88e5]"></div>
                <span className="text-sm text-gray-500">Active : <b className="text-gray-800 ml-1">{data.activeSubscribers}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#fb8c00]"></div>
                <span className="text-sm text-gray-500">Inactive : <b className="text-gray-800 ml-1">{data.totalSubscribers - data.activeSubscribers}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Pipeline Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">Action Pipeline</h2>
            <span className="text-gray-400 text-xs font-medium cursor-pointer hover:text-gray-600">
              This Week ▾
            </span>
          </div>
          <div className="p-6 pb-8">
            <p className="text-xs text-gray-500 mb-1 uppercase font-medium tracking-wide">Pending Tasks</p>
            <p className="text-4xl font-light text-gray-900 mb-8">{totalTasks}</p>
            
            <div className="h-3 w-full flex rounded-full overflow-hidden mb-4 bg-gray-100">
               {totalTasks === 0 && <div className="bg-gray-200 w-full h-full"></div>}
               {totalTasks > 0 && (
                 <>
                   <div className="bg-[#10b981] h-full" style={{ width: `${payPct}%` }}></div>
                   <div className="bg-[#ef4444] h-full" style={{ width: `${flagPct}%` }}></div>
                   <div className="bg-[#8b5cf6] h-full" style={{ width: `${prodPct}%` }}></div>
                 </>
               )}
            </div>
            
            <div className="flex gap-6 items-center mt-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></div>
                <span className="text-sm text-gray-500">Payments : <b className="text-gray-800 ml-1">{data.pendingPayments.length}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]"></div>
                <span className="text-sm text-gray-500">Flagged : <b className="text-gray-800 ml-1">{data.flaggedAssessments}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6]"></div>
                <span className="text-sm text-gray-500">Production : <b className="text-gray-800 ml-1">{data.pendingProduction.length}</b></span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Interactive Historical Charts Canvas ── */}
      <DashboardCharts 
         historicalOrders={data.historicalOrders} 
         historicalSubscriptions={data.historicalSubscriptions}
         totalSubscribers={data.totalSubscribers}
      />

      {/* ── Row 2: Data Grids (Zoho Lists Style) ── */}
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
                        <p className="text-sm font-semibold text-blue-600">{payment.customer_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{payment.payment_reference}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{payment.currency} {payment.payment_amount}</p>
                        <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">{new Date(payment.customer_claimed_sent_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/api/payments/admin-confirm?order_id=${payment.id}&token=${payment.payment_confirm_token}`}
                          className="inline-block bg-[#10b981] hover:bg-[#059669] text-white text-xs font-medium px-4 py-2 rounded shadow-sm transition-colors"
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
            <span className="text-gray-400 text-xs font-medium cursor-pointer hover:text-gray-600">Active Runs ▾</span>
          </div>
          <div className="p-0 overflow-auto flex-1">
            {data.pendingProduction.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6">
                <p className="text-gray-400 text-sm mb-2">No active production runs</p>
                <a href="/admin/production" className="text-blue-600 text-sm hover:underline">View queued formulas</a>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {data.pendingProduction.map((run: any) => (
                  <li key={run.id} className="p-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                    <div>
                      <p className="font-bold text-blue-600 text-sm">Run Core: {new Date(run.production_date).toLocaleDateString()}</p>
                      <div className="flex gap-4 mt-2">
                        <p className="text-xs text-gray-500">Status: <span className="uppercase font-semibold text-amber-500">{run.status}</span></p>
                        <p className="text-xs text-gray-500">Units: <span className="font-bold text-gray-700">{run.total_orders_covered}</span></p>
                      </div>
                    </div>
                    <a href="/admin/production" className="text-blue-600 text-sm hover:underline font-medium">Manage →</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
      </div>

      {/* ── Row 3: Outcomes & Alerts (Preserving Functionality) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Recent Outcomes Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[300px]">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">Recent Customer Outcomes</h2>
            <a href="/admin/outcomes" className="text-blue-600 text-xs font-medium hover:underline">View All</a>
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
                   if (hasAdverse) borderColor = 'border-red-300 bg-red-50/50'
                   else if (badScore) borderColor = 'border-amber-300 bg-amber-50/50'

                   return (
                     <div key={idx} className={`p-4 rounded-lg border shadow-sm ${borderColor}`}>
                       <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Week {outcome.check_in_week}</p>
                       <div className="mt-2 flex items-baseline gap-2">
                         <span className="text-2xl font-bold text-gray-900">{outcome.improvement_score ? outcome.improvement_score : '—'}</span>
                         <span className="text-sm font-medium text-gray-400">/ 10</span>
                       </div>
                       {hasAdverse && <p className="text-xs font-semibold text-red-600 mt-2 flex items-center bg-white w-max px-2 py-0.5 rounded shadow-sm border border-red-100">⚠️ Adverse Reaction</p>}
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
          <div className="p-6 overflow-auto flex-1">
            {data.flaggedAssessments > 0 ? (
               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700">
                 <div className="flex">
                    <span className="font-bold mr-2 text-lg">⚠️</span>
                    <div>
                      <h3 className="font-bold">Review Required</h3>
                       <p className="text-sm mt-1">{data.flaggedAssessments} assessments are automatically flagged for potentional medical contraindications.</p>
                       <a href="/admin/customers" className="inline-block mt-3 bg-white px-3 py-1.5 text-xs font-bold border border-red-200 rounded shadow-sm hover:bg-gray-50 transition-colors text-red-700">Review Flags</a>
                    </div>
                 </div>
               </div>
            ) : (
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
