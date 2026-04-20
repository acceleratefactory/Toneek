import { adminClient } from '@/lib/supabase/admin'

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
  ])

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
  }
}

export default async function AdminDashboardPage() {
  const data = await getSystemHealth()

  return (
    <div className="space-y-8" style={{ color: '#0f0f0f' }}>
      
      {/* ── Stat Cards ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">System Health</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase">Total Subs</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{data.totalSubscribers}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase">Active Subs</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1">{data.activeSubscribers}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm border-amber-200">
            <p className="text-sm font-medium text-amber-600 uppercase">Pending Payments</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{data.pendingPayments.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase">Flagged Assessments</p>
            <p className="text-3xl font-extrabold text-red-600 mt-1">{data.flaggedAssessments}</p>
          </div>
        </div>
      </div>

      {/* ── Pending Payments (Task 5.3) ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          Payments Awaiting Confirmation
          {data.pendingPayments.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">
              Action Required
            </span>
          )}
        </h2>
        
        {data.pendingPayments.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-gray-200 shadow-sm text-gray-500">
            No payments currently waiting for confirmation.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claimed At</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.pendingPayments.map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {payment.payment_reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.currency} {payment.payment_amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.plan_tier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.customer_claimed_sent_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/api/payments/admin-confirm?order_id=${payment.id}&token=${payment.payment_confirm_token}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Confirm Payment
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Production Queue Snapshot (Task 5.3 Row 3) ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Production Queue</h2>
        {data.pendingProduction.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-gray-500">
            No active production runs. Formulas are queued when payments are confirmed.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <ul className="divide-y divide-gray-200">
                {data.pendingProduction.map((run: any) => (
                  <li key={run.id} className="p-6 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">Run: {new Date(run.production_date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500 mt-1">Status: <span className="uppercase font-medium text-amber-600">{run.status}</span></p>
                      <p className="text-sm text-gray-500">Orders covered: {run.total_orders_covered}</p>
                    </div>
                    <a href="/admin/production" className="text-blue-600 hover:text-blue-800 font-medium">Manage Run →</a>
                  </li>
                ))}
             </ul>
          </div>
        )}
      </div>

      {/* ── Recent Outcomes (Task 5.3 Row 4) ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Outcomes</h2>
        {data.recentOutcomes.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-gray-500">
            No recent check-ins.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentOutcomes.map((outcome: any, idx: number) => {
               const hasAdverse = outcome.adverse_reactions === true
               const badScore = outcome.improvement_score && outcome.improvement_score < 4
               let borderColor = 'border-gray-200'
               if (hasAdverse) borderColor = 'border-red-400 bg-red-50'
               else if (badScore) borderColor = 'border-amber-400 bg-amber-50'

               return (
                 <div key={idx} className={`p-4 rounded-xl border shadow-sm ${borderColor}`}>
                   <p className="text-sm text-gray-500">Week {outcome.check_in_week} Check-in</p>
                   <p className="text-lg font-bold text-gray-900 mt-1">
                     Score: {outcome.improvement_score ? `${outcome.improvement_score}/10` : '—'}
                   </p>
                   {hasAdverse && <p className="text-sm font-medium text-red-600 mt-1">⚠️ Adverse Reaction</p>}
                   <p className="text-xs text-gray-400 mt-2">{new Date(outcome.recorded_at).toLocaleDateString()}</p>
                 </div>
               )
            })}
          </div>
        )}
      </div>

      {/* ── System Alerts (Task 5.3 Row 5) ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Alerts</h2>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
          {data.flaggedAssessments > 0 ? (
             <div className="flex items-center text-red-700">
               <span className="font-bold mr-2">⚠️ Review Required:</span> 
               {data.flaggedAssessments} assessments are flagged for potential contraindications.
             </div>
          ) : (
             <p className="text-gray-500">All systems nominally operating. No active alerts.</p>
          )}
        </div>
      </div>

    </div>
  )
}
