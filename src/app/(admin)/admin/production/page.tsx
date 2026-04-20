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
    .in('status', ['payment_confirmed', 'pending_formulation'])

  return {
    activeRun: activeRuns && activeRuns.length > 0 ? activeRuns[0] : null,
    historyRuns: historyRuns ?? [],
    ordersReady: ordersReady ?? 0,
  }
}

export default async function ProductionQueuePage() {
  const data = await getProductionData()

  return (
    <div className="space-y-8" style={{ color: '#0f0f0f' }}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Production Queue</h1>
        {data.ordersReady > 0 && !data.activeRun && (
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg flex items-center gap-3">
            <span className="text-blue-800 font-medium">{data.ordersReady} orders ready for formulation</span>
            <form action="/api/admin/production/generate" method="POST">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                Generate Run
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Active Production Run ── */}
      {data.activeRun ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Active Run: {new Date(data.activeRun.production_date).toLocaleDateString()}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Status: <span className="uppercase font-bold text-amber-600">{data.activeRun.status}</span> • Orders covered: {data.activeRun.total_orders_covered}
              </p>
            </div>
            <div className="flex gap-2">
              {data.activeRun.status === 'pending' && (
                // In an MVP, we could have a route to simply update status to in_production. 
                // For now it's visual. Mark Complete is the critical action.
                <div className="px-4 py-2 border border-blue-200 text-blue-700 rounded-md text-sm font-bold opacity-80 cursor-not-allowed">
                  Starts processing...
                </div>
              )}
              {data.activeRun.status !== 'complete' && data.activeRun.status !== 'dispatched' && (
                 <form action={`/api/admin/production/${data.activeRun.id}/complete`} method="POST">
                   <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                     Mark Complete & Dispatch
                   </button>
                 </form>
              )}
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Formula Batches</h3>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {Array.isArray(data.activeRun.batches) && data.activeRun.batches.map((batch: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-gray-900">{batch.formula_code}</span>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">
                      {batch.units} units
                    </span>
                  </div>
                  
                  {batch.warning ? (
                    <div className="text-red-600 text-sm font-medium p-3 bg-red-50 border border-red-100 rounded">
                      ⚠️ {batch.warning}
                    </div>
                  ) : (
                    <div className="font-mono text-sm space-y-2 mt-4 text-gray-800">
                      <div className="flex justify-between border-b pb-1">
                        <span>Base Formula:</span>
                        <span className="font-bold">{batch.base_grams}g</span>
                      </div>
                      {batch.ingredients?.map((ing: any, i: number) => (
                        <div key={i} className="flex justify-between border-b pb-1">
                          <span>{ing.name} {ing.concentration_pct}%:</span>
                          <span className="font-bold">{ing.grams_total}g</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 text-gray-900 font-bold">
                        <span>Total Batch Target:</span>
                        <span>{batch.total_grams}g</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Production History (Last 30 Days)</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Generated</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formulas Covered</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.historyRuns.map((run: any) => {
                  const uniqueFormulas = Array.isArray(run.batches) ? run.batches.map((b: any) => b.formula_code).join(', ') : '—'
                  return (
                    <tr key={run.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(run.production_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {uniqueFormulas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {run.total_orders_covered}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          run.status === 'dispatched' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {run.completed_at ? new Date(run.completed_at).toLocaleString() : '—'}
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
