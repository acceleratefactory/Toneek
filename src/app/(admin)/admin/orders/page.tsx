import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getOrders(filterState: string) {
  let query = adminClient
    .from('orders')
    .select('id, payment_reference, status, tracking_number, dispatch_held_reason, created_at, user_id, order_number')
    .order('created_at', { ascending: false })

  if (filterState === 'held') {
    query = query.eq('status', 'held_for_checkin')
  } else if (filterState === 'dispatch') {
    query = query.eq('status', 'pending_dispatch')
  } else if (filterState === 'dispatched') {
    query = query.eq('status', 'dispatched')
  } else if (filterState === 'production') {
    query = query.eq('status', 'in_production')
  }

  const { data: orders } = await query

  // Map profile names and formula codes manually for robustness without implicit FKs
  const enriched = await Promise.all((orders ?? []).map(async (o: any) => {
    let name = 'Unknown'
    let formula = '—'
    if (o.user_id) {
       const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', o.user_id).single()
       if (profile?.full_name) name = profile.full_name
       
       const { data: assessment } = await adminClient
         .from('skin_assessments')
         .select('formula_code')
         .eq('user_id', o.user_id)
         .order('created_at', { ascending: false })
         .limit(1)
         .maybeSingle()
       if (assessment?.formula_code) formula = assessment.formula_code
    }
    return { ...o, customer_name: name, formula }
  }))

  return enriched
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams
  const orders = await getOrders(filter)

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'held', label: 'Held for Check-in' },
    { id: 'production', label: 'In Production' },
    { id: 'dispatch', label: 'Pending Dispatch' },
    { id: 'dispatched', label: 'Dispatched' },
  ]

  return (
    <div className="space-y-6 text-gray-800">
      
      {/* ── Top Header Banner (Zoho Style) ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded flex items-center justify-center font-bold shadow-sm">
            OM
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-sm text-gray-500 mt-1">Review pending dispatches, held check-ins, and formulas</p>
          </div>
        </div>
        
        {/* ── Tabs Integrated into Banner ── */}
        <div className="flex gap-8 overflow-x-auto">
          {tabs.map((tab) => (
            <a
              key={tab.id}
              href={`/admin/orders?filter=${tab.id}`}
              className={`pb-4 text-sm font-semibold tracking-wide transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'border-b-2 border-[#b8895a] text-[#b8895a]'
                  : 'text-gray-500 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-200 cursor-pointer'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[500px]">
        {orders.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center flex-1">
            <p className="text-gray-400 text-sm">No orders found matching this filter.</p>
          </div>
        ) : (
          <div className="p-0 overflow-auto flex-1">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 rounded-tl-xl border-t-0">Ref / Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100">Customer / Formula</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100">State</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 tracking-wide uppercase border-b border-gray-100 rounded-tr-xl">Action</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{order.payment_reference}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Order #{order.order_number}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{order.formula}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                        order.status === 'held_for_checkin' ? 'bg-orange-50 text-orange-700' :
                        order.status === 'pending_dispatch' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'dispatched' ? 'bg-green-50 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      {order.status === 'held_for_checkin' && order.dispatch_held_reason && (
                        <div className="text-[10px] text-orange-600 mt-1 font-medium">
                          ⚠️ {order.dispatch_held_reason.replace(/_/g, ' ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {order.status === 'pending_dispatch' && (
                        <form action={`/api/admin/orders/${order.id}/dispatch`} method="POST" className="flex items-center justify-end gap-2">
                          <input type="text" name="tracking" placeholder="Tracking #..." className="border border-gray-200 rounded px-2 py-1 text-xs w-32" required />
                          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-bold">Dispatch</button>
                        </form>
                      )}
                      {order.status === 'held_for_checkin' && (
                        <form action={`/api/admin/orders/${order.id}/override-hold`} method="POST">
                          <button type="submit" className="text-orange-600 hover:text-orange-700 text-xs font-bold underline">Override Hold</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
