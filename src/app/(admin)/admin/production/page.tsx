import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

async function getProductionData() {
  // Get active run (pending or in_production)
  const { data: activeRuns } = await adminClient
    .from('production_queue')
    .select('*')
    .in('status', ['pending', 'in_production'])
    .order('production_date', { ascending: true })

  // Get historical runs (complete or dispatched)
  const { data: historyRuns } = await adminClient
    .from('production_queue')
    .select('*')
    .in('status', ['complete', 'dispatched'])
    .order('completed_at', { ascending: false })
    .limit(30)

  // Get orders ready for production that haven't been queued yet
  const { count: ordersReady } = await adminClient
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['payment_confirmed', 'pending_formulation', 'pending_production'])

  // Fetch companion product inventory
  const { data: inventoryData } = await adminClient
    .from('companion_product_inventory')
    .select('*')

  const inventory = inventoryData?.reduce((acc: any, item: any) => {
    acc[item.product_sku] = item
    return acc
  }, {}) || {}

  let activeRunOrders: any[] = []
  const activeRun = activeRuns && activeRuns.length > 0 ? activeRuns[0] : null
  
  if (activeRun) {
    const isObject = !Array.isArray(activeRun.batches) && activeRun.batches !== null
    const formula_batches = isObject ? activeRun.batches.formula_batches : activeRun.batches
    
    let allOrderIds: string[] = []
    if (formula_batches) {
      for (const batch of formula_batches) {
        if (batch.order_ids) allOrderIds.push(...batch.order_ids)
      }
    }
    
    if (allOrderIds.length > 0) {
      const { data: orders } = await adminClient
        .from('orders')
        .select('id, payment_reference, user_id, routine_tier, fourth_product, formula_code, plan_tier')
        .in('id', allOrderIds)
      activeRunOrders = orders || []
    }
  }

  return {
    activeRun,
    historyRuns: historyRuns ?? [],
    ordersReady: ordersReady ?? 0,
    inventory,
    activeRunOrders
  }
}

export default async function ProductionQueuePage() {
  const data = await getProductionData()

  let formulaBatches = []
  let companionCounts: Record<string, number> = {}
  
  if (data.activeRun) {
    const isObject = !Array.isArray(data.activeRun.batches) && data.activeRun.batches !== null
    formulaBatches = isObject ? data.activeRun.batches.formula_batches || [] : data.activeRun.batches || []
    companionCounts = isObject ? data.activeRun.batches.companion_products || {} : {}
  }

  const skus = [
    { sku: 'TNK-CLN-100', name: 'Toneek Barrier Cleanser 100ml' },
    { sku: 'TNK-MST-50', name: 'Toneek Lightweight Moisturiser 50ml' },
    { sku: 'TNK-SPF-30', name: 'Toneek Mineral SPF 50 30ml' },
    { sku: 'TNK-TON-BRT', name: 'Toneek Brightening Toner 30ml' },
    { sku: 'TNK-TON-HYD', name: 'Toneek Hydrating Toner 30ml' },
  ]

  const fourthProductMap: Record<string, string> = {
    'toneek_mineral_spf_50': 'Toneek Mineral SPF 50 30ml',
    'toneek_brightening_toner': 'Toneek Brightening Toner 30ml',
    'toneek_hydrating_toner': 'Toneek Hydrating Toner 30ml',
  }

  return (
    <div className="space-y-6 text-gray-800">
      
      {/* ── Top Header Banner (Zoho Style) ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative flex justify-between items-end pb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-toneek-cream border border-toneek-gray text-toneek-brown rounded flex items-center justify-center font-bold shadow-sm">
            PQ
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Production Queue</h1>
            <p className="text-sm text-gray-500 mt-1">Manage daily formulation runs and dispatch tracking</p>
          </div>
        </div>
        {data.ordersReady > 0 && !data.activeRun && (
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm font-medium">{data.ordersReady} orders queued</span>
            <form action="/api/admin/production/generate" method="POST">
              <button type="submit" className="bg-toneek-brown hover:bg-[#1A1210] text-[#ffffff] px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-colors">
                Generate Run +
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Active Production Run ── */}
      {data.activeRun ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                Active Run / <span className="text-gray-500">{new Date(data.activeRun.production_date).toLocaleDateString()}</span>
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="uppercase text-xs font-bold text-toneek-alert">{data.activeRun.status}</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">{data.activeRun.total_orders_covered} Total Units</span>
              </div>
            </div>
            <div className="flex gap-2">
              {data.activeRun.status === 'pending' && (
                <div className="px-4 py-2 border border-toneek-lightgray text-toneek-gray rounded-md text-sm font-bold opacity-80 cursor-not-allowed">
                  Starts processing...
                </div>
              )}
              {data.activeRun.status !== 'complete' && data.activeRun.status !== 'dispatched' && (
                 <form action={`/api/admin/production/${data.activeRun.id}/complete`} method="POST" className="flex items-center gap-4">
                   {Object.values(companionCounts).some(count => count > 0) && (
                     <div className="flex items-center gap-2 bg-toneek-cream px-3 py-2 rounded border border-toneek-lightgray">
                       <input type="checkbox" id="companion_confirmed" name="companion_confirmed" value="true" required className="w-4 h-4 text-toneek-forest rounded border-gray-300 cursor-pointer" />
                       <label htmlFor="companion_confirmed" className="text-xs font-bold text-toneek-brown cursor-pointer uppercase tracking-wider">
                         All companions pulled
                       </label>
                     </div>
                   )}
                   <button type="submit" className="bg-toneek-forest hover:bg-[#144229] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap">
                     Mark Complete & Dispatch
                   </button>
                 </form>
              )}
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Formula Batches</h3>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {formulaBatches.map((batch: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono font-bold text-lg text-toneek-brown">{batch.formula_code}</span>
                    <span className="bg-toneek-alertbg text-toneek-alert text-xs font-bold px-2 py-1 rounded">
                      {batch.units} units
                    </span>
                  </div>
                  
                  {batch.warning ? (
                    <div className="text-red-600 text-sm font-medium p-3 bg-red-50 border border-red-100 rounded">
                      ⚠️ {batch.warning}
                    </div>
                  ) : (
                    <details className="mt-4 group">
                      <summary className="cursor-pointer text-sm font-bold text-toneek-brown hover:text-black list-none flex items-center gap-2">
                        <span>View Compounding Recipe</span>
                        <span className="transition duration-200 group-open:rotate-180 text-xs">▼</span>
                      </summary>
                      <div className="font-mono text-sm space-y-2 mt-3 pt-3 border-t border-gray-200 text-gray-800">
                        {batch.ingredients?.map((ing: any, i: number) => (
                          <div key={i} className="flex justify-between border-b pb-1 border-gray-100">
                            <span>{ing.name} {ing.concentration_pct}%:</span>
                            <span className="font-bold text-gray-900">{ing.grams_total}g</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 text-gray-900 font-black text-base border-t-2 border-gray-800 mt-2 pb-1">
                          <span>Total Batch Target:</span>
                          <span>{batch.total_grams}g</span>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {Object.keys(companionCounts).length > 0 && (
              <>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-10 mb-4">Companion Products — Pull From Stock</h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Units Needed</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">In Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {skus.map(({ sku, name }) => {
                        const needed = companionCounts[sku] || 0
                        if (needed === 0) return null
                        const inStock = data.inventory[sku]?.units_in_stock || 0
                        const isShortage = inStock < needed

                        return (
                          <tr key={sku}>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">{name}</td>
                            <td className="px-4 py-4 text-sm text-gray-500 font-mono">{sku}</td>
                            <td className="px-4 py-4 text-sm font-bold text-center text-toneek-brown">{needed}</td>
                            <td className={`px-4 py-4 text-sm font-bold text-center ${isShortage ? 'text-red-600' : 'text-gray-900'}`}>
                              {inStock}
                            </td>
                            <td className="px-4 py-4 text-sm text-right">
                              {isShortage ? (
                                <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-200 text-xs">⚠️ Shortage</span>
                              ) : (
                                <span className="text-green-700 font-bold bg-green-50 px-2 py-1 rounded border border-green-200 text-xs">✓ Ready</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-10 mb-4">Packing List</h3>
                <div className="grid gap-4 grid-cols-1">
                  {data.activeRunOrders.map((order: any) => (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="font-bold text-gray-900 mb-2 pb-2 border-b border-gray-100 flex justify-between">
                        <span>Order {order.payment_reference}</span>
                        <span className="text-gray-500 text-sm font-normal">Formula: <span className="font-mono text-toneek-brown font-bold">{order.formula_code || 'TBD'}</span> | Plan: {order.routine_tier}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4 text-toneek-forest rounded border-gray-300" />
                          <span>Formula (Custom: {order.formula_code})</span>
                        </div>
                        
                        {(order.routine_tier === 'two_to_three' || order.routine_tier === 'whatever_it_takes') && (
                          <>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" className="w-4 h-4 text-toneek-forest rounded border-gray-300" />
                              <span>Toneek Barrier Cleanser 100ml</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" className="w-4 h-4 text-toneek-forest rounded border-gray-300" />
                              <span>Toneek Lightweight Moisturiser 50ml</span>
                            </div>
                          </>
                        )}

                        {order.routine_tier === 'whatever_it_takes' && order.fourth_product && (
                          <div className="flex items-center gap-2">
                            <input type="checkbox" className="w-4 h-4 text-toneek-forest rounded border-gray-300" />
                            <span className="font-bold text-toneek-brown">{fourthProductMap[order.fourth_product] || order.fourth_product}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 font-medium">No active production runs.</p>
          <p className="text-gray-400 text-sm mt-2">New runs are generated daily from confirmed payments.</p>
        </div>
      )}

      {/* ── Historical Runs ── */}
      {data.historyRuns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-[350px]">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-gray-800">Production History (Last 30 Days)</h2>
          </div>
          <div className="p-0 overflow-auto flex-1">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">Date Generated</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">Formulas Covered</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">Units</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">Completed At</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 tracking-wide uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.historyRuns.map((run: any) => {
                  const isObject = !Array.isArray(run.batches) && run.batches !== null
                  const fBatches = isObject ? run.batches.formula_batches || [] : run.batches || []
                  const uniqueFormulas = fBatches.map((b: any) => b.formula_code).join(', ') || '—'
                  
                  return (
                    <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        <a href={`/admin/production/${run.id}`} className="text-toneek-brown hover:text-black underline">
                          {new Date(run.production_date).toLocaleDateString()}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {uniqueFormulas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {run.total_orders_covered}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          run.status === 'dispatched' ? 'bg-toneek-sage text-toneek-forest' : 'bg-toneek-cream text-toneek-brown border border-toneek-lightgray'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {run.completed_at ? new Date(run.completed_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href={`/admin/production/${run.id}`} className="text-toneek-brown hover:text-black font-bold">
                          View Log &rarr;
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
