import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getOutcomes() {
  const { data: outcomes } = await adminClient
    .from('skin_outcomes')
    .select('*')
    .order('created_at', { ascending: false })

  // Map profile names manually
  const enriched = await Promise.all((outcomes ?? []).map(async (o: any) => {
    let name = 'Unknown Customer'
    if (o.user_id) {
       const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', o.user_id).single()
       if (profile?.full_name) name = profile.full_name
    }
    return { ...o, customer_name: name }
  }))

  return enriched
}

export default async function AdminOutcomesPage() {
  const outcomes = await getOutcomes()

  return (
    <div className="space-y-6 text-gray-800">
      
      {/* ── Top Header Banner (Zoho Style) ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative pb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-toneek-cream border border-toneek-lightgray text-toneek-brown rounded flex items-center justify-center font-bold shadow-sm">
            CO
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clinical Outcomes Log</h1>
            <p className="text-sm text-gray-500 mt-1">Review global check-in logs, clinical scores, and flag interventions</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[500px]">
        <div className="p-0 overflow-auto flex-1">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 rounded-tl-xl border-t-0">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 border-t-0">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 border-t-0">Milestone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 border-t-0">Old Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 border-t-0">New Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 rounded-tr-xl border-t-0">Flag Alerts</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
               {outcomes.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                     No clinical outcomes recorded yet. Check-ins begin after 14 days.
                   </td>
                 </tr>
               ) : outcomes.map((outcome) => (
                 <tr key={outcome.id}>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {new Date(outcome.created_at).toLocaleDateString()}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                     {outcome.customer_name}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                     {outcome.check_in_stage || '—'}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {outcome.previous_score ?? '—'}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                     {outcome.new_score ?? '—'}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {outcome.is_flagged ? (
                        <span className="px-2 py-0.5 inline-flex text-[10px] uppercase tracking-wider font-bold rounded-md bg-toneek-errorbg text-toneek-error border border-toneek-errorbg">
                          {outcome.flag_reason || 'Requires Review'}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium">Nominal</span>
                      )}
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
