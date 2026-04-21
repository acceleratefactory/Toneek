import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getPayments() {
  const { data: orders, error } = await adminClient
    .from('orders')
    .select('id, payment_reference, status, payment_amount, currency, customer_claimed_sent_at, user_id, plan_tier')
    .order('customer_claimed_sent_at', { ascending: false })

  if (error) console.error("Error fetching payments log:", error)

  // Map profile names manually
  const enriched = await Promise.all((orders ?? []).map(async (o: any) => {
    let name = 'Unknown Customer'
    if (o.user_id) {
       const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', o.user_id).single()
       if (profile?.full_name) name = profile.full_name
    }
    return { ...o, customer_name: name }
  }))

  return enriched
}

export default async function AdminPaymentsPage() {
  const payments = await getPayments()

  return (
    <div className="space-y-6 text-gray-800">
      
      {/* ── Top Header Banner (Zoho Style) ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative pb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded flex items-center justify-center font-bold shadow-sm">
            FL
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Financial Ledger</h1>
            <p className="text-sm text-gray-500 mt-1">Review global payment streams and pending clearing queues</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[500px]">
        <div className="p-0 overflow-auto flex-1">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 rounded-tl-xl">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100">Reference</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 rounded-tr-xl">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
               {payments.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                     No recent payment activity found.
                   </td>
                 </tr>
               ) : payments.map((payment) => (
                 <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {payment.customer_claimed_sent_at ? new Date(payment.customer_claimed_sent_at).toLocaleDateString() : '—'}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                     {payment.payment_reference || '—'}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                     {payment.customer_name}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                     {payment.currency} {payment.payment_amount?.toLocaleString() || '—'}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-xs uppercase font-semibold text-gray-500 tracking-wider">
                     {payment.plan_tier?.replace(/_/g, ' ')}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-[10px] uppercase tracking-wider font-bold rounded-md border ${
                        payment.status === 'payment_confirmed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {payment.status.replace(/_/g, ' ')}
                      </span>
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
