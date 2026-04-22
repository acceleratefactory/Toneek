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

  return {
    activeRun: activeRuns && activeRuns.length > 0 ? activeRuns[0] : null,
    historyRuns: historyRuns ?? [],
    ordersReady: ordersReady ?? 0,
  }
}

export default async function ProductionQueuePage() {
  const data = await getProductionData()

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
                // In an MVP, we could have a route to simply update status to in_production. 
                // For now it's visual. Mark Complete is the critical action.
                <div className="px-4 py-2 border border-toneek-lightgray text-toneek-gray rounded-md text-sm font-bold opacity-80 cursor-not-allowed">
                  Starts processing...
                </div>
              )}
              {data.activeRun.status !== 'complete' && data.activeRun.status !== 'dispatched' && (
                 <form action={`/api/admin/production/${data.activeRun.id}/complete`} method="POST">
                   <button type="submit" className="bg-toneek-forest hover:bg-[#144229] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
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
                  const uniqueFormulas = Array.isArray(run.batches) ? run.batches.map((b: any) => b.formula_code).join(', ') : '—'
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
