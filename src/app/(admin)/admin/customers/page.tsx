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
        id, full_name, email, country, subscription_status, subscription_tier, phone, whatsapp,
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
    <div className="space-y-6 text-gray-800">
      
      {/* ── Top Header Banner (Zoho Style) ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-toneek-cream border border-toneek-lightgray text-toneek-brown rounded flex items-center justify-center font-bold shadow-sm">
            US
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">User Directory</h1>
            <p className="text-sm text-gray-500 mt-1">Manage global subscriber base and flagged physical risk profiles</p>
          </div>
        </div>
        
        {/* ── Tabs Integrated into Banner ── */}
        <div className="flex gap-8 overflow-x-auto">
          <a
            href="/admin/customers?tab=all"
            className={`pb-4 text-sm font-semibold tracking-wide transition-colors whitespace-nowrap ${
              tab === 'all'
                ? 'border-b-2 border-toneek-amber text-toneek-amber'
                : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-200 cursor-pointer'
            }`}
          >
            All Customers
          </a>
          <a
            href="/admin/customers?tab=flagged"
            className={`flex items-center gap-2 pb-4 text-sm font-semibold tracking-wide transition-colors whitespace-nowrap ${
              tab === 'flagged'
                ? 'border-b-2 border-toneek-error text-toneek-error'
                : 'text-toneek-alert hover:text-toneek-error border-b-2 border-transparent hover:border-toneek-errorbg cursor-pointer'
            }`}
          >
            Flagged Review Queue <span className="bg-toneek-errorbg text-toneek-error text-[10px] px-1.5 py-0.5 rounded font-bold">{flagged.length}</span>
          </a>
        </div>
      </div>

      {/* ── FLAG TAB ── */}
      {tab === 'flagged' && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm flex flex-col min-h-[500px]">
          {flagged.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center flex-1">
              <p className="text-gray-400 text-sm">No flagged assessments currently pending review.</p>
            </div>
          ) : (
            <div className="p-0 overflow-auto flex-1">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-red-50/30">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-red-700 tracking-wide uppercase border-b border-red-100 rounded-tl-xl border-t-0">Customer</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-red-700 tracking-wide uppercase border-b border-red-100 border-t-0">Flag Reason</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-red-700 tracking-wide uppercase border-b border-red-100 border-t-0">Assigned Formula</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-red-700 tracking-wide uppercase border-b border-red-100 border-t-0">Days Since Flagged</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-red-700 tracking-wide uppercase border-b border-red-100 rounded-tr-xl border-t-0">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-red-50">
                  {flagged.map((f: any) => {
                    const daysSince = Math.floor((new Date().getTime() - new Date(f.created_at).getTime()) / (1000 * 3600 * 24))
                    return (
                      <tr key={f.id} className="hover:bg-red-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{f.profiles?.full_name ?? 'Unknown'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{f.profiles?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-toneek-error bg-toneek-errorbg border border-toneek-error px-2 py-1 rounded uppercase tracking-wider">
                            {f.flag_reason ?? 'Manual review required'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono font-bold">
                          {f.formula_code ?? 'None'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {daysSince} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <button className="text-toneek-brown hover:text-black font-bold text-xs border border-toneek-lightgray px-3 py-1.5 rounded transition-colors">Review</button>
                            <button className="text-gray-600 hover:text-gray-900 font-bold text-xs border border-gray-200 px-3 py-1.5 rounded transition-colors">Clear</button>
                            <button className="text-white bg-toneek-error hover:bg-[#A03226] font-bold text-xs px-3 py-1.5 rounded shadow-sm transition-colors">Derm Bridge</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ALL CUSTOMERS TAB ── */}
      {tab === 'all' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[500px]">
          {customers.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center flex-1">
              <p className="text-gray-400 text-sm">No customers found.</p>
            </div>
          ) : (
            <div className="p-0 overflow-auto flex-1">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 rounded-tl-xl border-t-0">Name / Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 border-t-0">Country</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 border-t-0">Formula / Sub</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 border-t-0">Scores</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 border-t-0">Check-in</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 rounded-tr-xl border-t-0">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
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
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{c.full_name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{c.email}</div>
                          {(c.whatsapp || c.phone) && (
                            <div className="flex gap-2 mt-1.5">
                              {c.whatsapp && <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded font-bold uppercase">WA: {c.whatsapp}</span>}
                              {c.phone && c.phone !== c.whatsapp && <span className="text-[10px] text-gray-600 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded font-bold uppercase">Ph: {c.phone}</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {c.country}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-bold text-toneek-brown">{formula}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Tier: {c.subscription_tier?.replace(/_/g, ' ') ?? 'None'}</div>
                          <span className={`mt-1.5 px-2 py-0.5 inline-flex text-[10px] font-bold uppercase tracking-wider rounded border ${
                            c.subscription_status === 'active' ? 'bg-toneek-sage border-toneek-sage text-toneek-forest' : 'bg-toneek-cream border-toneek-lightgray text-toneek-brown'
                          }`}>
                            {c.subscription_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">OS Score: <span className="font-bold">{osScore}</span></div>
                          <div className={`text-[10px] uppercase font-bold tracking-wider mt-1.5 px-2 py-0.5 inline-block rounded border ${riskScore > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                            Risk: {riskScore}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{weeksActive} weeks active</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {latestOutcome ? new Date(latestOutcome.recorded_at).toLocaleDateString() : 'No check-ins yet'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <a href={`/admin/customers/${c.id}`} className="text-toneek-brown hover:text-black font-bold border border-toneek-lightgray hover:bg-toneek-cream px-3 py-1.5 rounded transition-colors">
                            View Profile
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
