import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getCustomers(tab: string) {
  if (tab === 'flagged') {
    const { data } = await adminClient
      .from('skin_assessments')
      .select('id, user_id, is_flagged_for_review, flag_reason, formula_code, created_at, profiles(full_name, email)')
      .eq('is_flagged_for_review', true)
      .order('created_at', { ascending: false })
      
    return { customers: [], flagged: data ?? [] }
  } else {
    const { data } = await adminClient
      .from('profiles')
      .select(`
        id, full_name, email, country, subscription_status, subscription_tier, 
        created_at, data_quality_score,
        skin_assessments(formula_code, skin_os_score, risk_score),
        skin_outcomes(recorded_at)
      `)
      .order('created_at', { ascending: false })
      
    return { customers: data ?? [], flagged: [] }
  }
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'all' } = await searchParams
  const { customers, flagged } = await getCustomers(tab)

  return (
    <div className="space-y-8" style={{ color: '#0f0f0f' }}>
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <div className="space-x-4">
          <a
            href="/admin/customers?tab=all"
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              tab === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Customers
          </a>
          <a
            href="/admin/customers?tab=flagged"
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              tab === 'flagged' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
            }`}
          >
            Flagged Assessments
          </a>
        </div>
      </div>

      {/* ── FLAG TAB ── */}
      {tab === 'flagged' && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          {flagged.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No flagged assessments currently pending review.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Flag Reason</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Assigned Formula</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-red-800 uppercase tracking-wider">Days Since Flagged</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-red-800 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flagged.map((f: any) => {
                  const daysSince = Math.floor((new Date().getTime() - new Date(f.created_at).getTime()) / (1000 * 3600 * 24))
                  return (
                    <tr key={f.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{f.profiles?.full_name ?? 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{f.profiles?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                          {f.flag_reason ?? 'Manual review required'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {f.formula_code ?? 'None'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {daysSince} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button className="text-blue-600 hover:text-blue-900 font-medium text-xs border border-blue-200 px-2 py-1 rounded">Review</button>
                          <button className="text-gray-600 hover:text-gray-900 font-medium text-xs border border-gray-200 px-2 py-1 rounded">Clear</button>
                          <button className="text-red-600 hover:text-red-900 font-medium text-xs border border-red-200 px-2 py-1 rounded">Derm Bridge</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ALL CUSTOMERS TAB ── */}
      {tab === 'all' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
          {customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No customers found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formula / Sub</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scores</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((c: any) => {
                  const assessments = Array.isArray(c.skin_assessments) ? c.skin_assessments : []
                  const outcomes = Array.isArray(c.skin_outcomes) ? c.skin_outcomes : []
                  
                  // Sort to get latest
                  const latestAssessment = assessments.sort((a: any, b: any) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )[0]
                  
                  const latestOutcome = outcomes.sort((a: any, b: any) => 
                    new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
                  )[0]

                  const formula = latestAssessment?.formula_code ?? 'None'
                  const osScore = latestAssessment?.skin_os_score ?? '—'
                  const riskScore = latestAssessment?.risk_score ?? 0
                  
                  // Calculate weeks active based on created_at
                  const weeksActive = Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24 * 7))

                  return (
                    <tr key={c.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{c.full_name}</div>
                        <div className="text-sm text-gray-500">{c.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {c.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-gray-900">{formula}</div>
                        <div className="text-xs text-gray-500 mt-1">Tier: {c.subscription_tier ?? 'none'}</div>
                        <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          c.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {c.subscription_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">OS Score: <span className="font-bold">{osScore}</span></div>
                        <div className={`text-xs mt-1 ${riskScore > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          Risk: {riskScore}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{weeksActive} weeks active</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {latestOutcome ? new Date(latestOutcome.recorded_at).toLocaleDateString() : 'No check-ins yet'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <a href={`/admin/customers/${c.id}`} className="text-blue-600 hover:text-blue-900 font-bold bg-blue-50 px-3 py-2 rounded transition-colors">
                          View Profile
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  )
}
