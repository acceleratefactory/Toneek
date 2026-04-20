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
    <div className="space-y-8" style={{ color: '#0f0f0f' }}>
      <div className="flex justify-between items-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clinical Outcomes Log</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Score</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Score</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flag Alerts</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
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
                      <span className="px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800">
                        {outcome.flag_reason || 'Requires Review'}
                      </span>
                    ) : (
                      <span className="text-gray-400">Nominal</span>
                    )}
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
