import { adminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getProductionRun(id: string) {
  const { data: run } = await adminClient
    .from('production_queue')
    .select('*')
    .eq('id', id)
    .single()

  return run
}

export default async function ProductionRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const id = resolvedParams.id
  const run = await getProductionRun(id)

  if (!run) notFound()

  return (
    <div className="space-y-8" style={{ color: '#0f0f0f' }}>
      
      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
        <Link 
          href="/admin/production" 
          className="text-gray-500 hover:text-gray-900 font-bold transition-colors"
        >
          &larr; Back to Queue
        </Link>
        <div className="h-6 w-px bg-gray-300"></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Historical Run Record
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generated: {new Date(run.generated_at || run.production_date).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
           <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
             run.status === 'dispatched' ? 'bg-green-100 text-green-800' :
             run.status === 'complete' ? 'bg-blue-100 text-blue-800' :
             'bg-gray-100 text-gray-800'
           }`}>
             Status: {run.status}
           </span>
        </div>
      </div>

      {/* ── METRICS ── */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Orders Covered</p>
           <p className="text-3xl font-black text-gray-900 mt-2">{run.total_orders_covered}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Formulas Batched</p>
           <p className="text-3xl font-black text-gray-900 mt-2">{Array.isArray(run.batches) ? run.batches.length : 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Completed At</p>
           <p className="text-lg font-bold text-gray-900 mt-2 pt-1">{run.completed_at ? new Date(run.completed_at).toLocaleString() : 'Pending'}</p>
        </div>
      </div>

      {/* ── BATCH ARCHIVES ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
           <h2 className="font-bold text-gray-900">Formula Production Archive</h2>
         </div>
         <div className="p-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {Array.isArray(run.batches) && run.batches.map((batch: any, index: number) => (
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
                    <details className="mt-4 group open" open>
                      <summary className="cursor-pointer text-sm font-bold text-blue-600 hover:text-blue-800 list-none flex items-center gap-2">
                        <span>View Compounded Recipe</span>
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
                          <span>Total Batch Prepared:</span>
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
    </div>
  )
}
