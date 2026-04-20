import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getPayments() {
  const { data: orders } = await adminClient
    .from('orders')
    .select('id, payment_reference, status, amount, currency, created_at, user_id, subscription_tier')
    .order('created_at', { ascending: false })

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
    <div className="space-y-8" style={{ color: '#0f0f0f' }}>
      <div className="flex justify-between items-center border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Payments Log</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
             {payments.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                   No recent payment activity found.
                 </td>
               </tr>
             ) : payments.map((payment) => (
               <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                   {new Date(payment.created_at).toLocaleString()}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                   {payment.payment_reference || '—'}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                   {payment.customer_name}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                   {payment.currency} {payment.amount?.toLocaleString()}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                   {payment.subscription_tier}
                 </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'payment_confirmed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {payment.status.replace('_', ' ')}
                    </span>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
