import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getOrders(filterState: string) {
  let query = adminClient
    .from('orders')
    .select('id, payment_reference, status, tracking_number, dispatch_held_reason, created_at, user_id, order_number, skin_assessments(formula_code)')
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

  // Map profile names manually for robustness
  const enriched = await Promise.all((orders ?? []).map(async (o: any) => {
    let name = 'Unknown'
    if (o.user_id) {
       const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', o.user_id).single()
       if (profile?.full_name) name = profile.full_name
    }
    return { ...o, customer_name: name, formula: o.skin_assessments?.formula_code ?? '—' }
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
    <div className="space-y-8" style={{ color: '#0f0f0f' }}>
      <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>

      {/* ── Tabs ── */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <a
              key={tab.id}
              href={`/admin/orders?filter=${tab.id}`}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                filter === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No orders found matching this filter.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref / Created</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer / Formula</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order: any) => (
                <tr key={order.id} className={order.status === 'held_for_checkin' ? 'bg-orange-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{order.payment_reference}</div>
                    <div className="text-sm text-gray-500 mt-1">Order #{order.order_number}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                    <div className="text-sm text-gray-500 mt-1">{order.formula}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${
                      order.status === 'held_for_checkin' ? 'bg-orange-100 text-orange-800' :
                      order.status === 'pending_dispatch' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'dispatched' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                    {order.status === 'held_for_checkin' && order.dispatch_held_reason && (
                      <div className="text-xs text-orange-600 mt-2 max-w-xs font-medium">
                        ⚠️ Held: {order.dispatch_held_reason.replace(/_/g, ' ')}
                      </div>
                    )}
                    {order.tracking_number && (
                      <div className="text-xs text-gray-500 mt-2 font-mono">
                        Tracking: {order.tracking_number}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {order.status === 'pending_dispatch' && (
                      <form action={`/api/admin/orders/${order.id}/dispatch`} method="POST" className="flex items-center justify-end gap-2">
                        <input 
                          type="text" 
                          name="tracking" 
                          placeholder="Paste tracking #..." 
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-36"
                          required
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors text-xs font-bold">
                          Mark Dispatched
                        </button>
                      </form>
                    )}
                    
                    {order.status === 'held_for_checkin' && (
                      <form action={`/api/admin/orders/${order.id}/override-hold`} method="POST">
                        <button type="submit" className="border border-orange-400 text-orange-600 hover:bg-orange-100 px-3 py-1 rounded transition-colors text-xs font-bold">
                          Override Hold
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
