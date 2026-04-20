import { adminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getCustomerData(id: string) {
  // Fetch profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) return null

  // Fetch assessments (newest first)
  const { data: assessments } = await adminClient
    .from('skin_assessments')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Fetch orders
  const { data: orders } = await adminClient
    .from('orders')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Fetch outcomes
  const { data: outcomes } = await adminClient
    .from('skin_outcomes')
    .select('*')
    .eq('user_id', id)
    .order('check_in_week', { ascending: true })

  return {
    profile,
    assessments: assessments ?? [],
    orders: orders ?? [],
    outcomes: outcomes ?? [],
  }
}

export default async function CustomerDetailPage(
  // Use Promise for params in NextJS 15 App router
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const id = resolvedParams.id
  
  const data = await getCustomerData(id)
  
  if (!data) notFound()
  
  const latestAssessment = data.assessments[0]
  const isFlagged = latestAssessment?.is_flagged_for_review

  return (
    <div className="space-y-8" style={{ color: '#0f0f0f' }}>
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{data.profile.full_name}</h1>
          <p className="text-gray-500 mt-1">{data.profile.email} • {data.profile.phone ?? 'No phone'}</p>
          <div className="flex gap-2 mt-3">
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
               data.profile.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
             }`}>
               Status: {data.profile.subscription_status}
             </span>
             {latestAssessment && (
               <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                 Formula: {latestAssessment.formula_code ?? 'Pending'}
               </span>
             )}
          </div>
        </div>
        <div className="flex gap-2">
           <a href={`https://wa.me/${data.profile.phone?.replace('+', '')}`} target="_blank" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-bold text-sm transition-colors cursor-pointer flex items-center gap-2">
             <span>💬</span> WhatsApp
           </a>
           <button className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-md font-bold text-sm transition-colors border">
             Update Formula
           </button>
        </div>
      </div>

      {/* ── ALERTS / FLAGS ── */}
      {isFlagged && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-red-800 font-bold flex items-center gap-2">
            ⚠️ Assessment Flagged For Review
          </h2>
          <p className="text-red-700 mt-2 text-sm">
            Reason: <span className="font-bold">{latestAssessment.flag_reason}</span>
          </p>
          <div className="mt-4 flex gap-3">
             <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold rounded">Trigger Dermatology Bridge</button>
             <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 text-xs font-bold rounded">Clear Flag</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-8">
          
          {/* Assessment Summary */}
          {latestAssessment && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                 <h2 className="font-bold text-gray-900">Latest Assessment</h2>
                 <span className="text-xs text-gray-500">{new Date(latestAssessment.created_at).toLocaleDateString()}</span>
               </div>
               <div className="p-6 space-y-4 text-sm text-gray-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-500">Skin Type:</span><br/><b>{latestAssessment.skin_type}</b></div>
                    <div><span className="text-gray-500">Fitzpatrick:</span><br/><b>{latestAssessment.fitzpatrick_estimate}</b></div>
                    <div><span className="text-gray-500">Primary Concern:</span><br/><b>{latestAssessment.primary_concern}</b></div>
                    <div><span className="text-gray-500">Climate:</span><br/><b>{latestAssessment.climate_zone}</b></div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-gray-500 mb-1">Assigned Formula:</p>
                    <p className="font-mono font-bold text-lg">{latestAssessment.formula_code}</p>
                    <p className="text-gray-600 mt-2 bg-gray-50 p-3 rounded">{latestAssessment.formula_rationale}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                       <span className="text-gray-500">Skin OS Score:</span><br/>
                       <span className="text-2xl font-black text-gray-900">{latestAssessment.skin_os_score}/100</span>
                    </div>
                    <div className="text-right">
                       <span className="text-gray-500">Risk Score:</span><br/>
                       <span className={`text-xl font-black ${latestAssessment.risk_score > 0 ? 'text-red-500' : 'text-green-500'}`}>
                         {latestAssessment.risk_score}
                       </span>
                    </div>
                  </div>
               </div>
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-8">
          
          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
               <h2 className="font-bold text-gray-900">Order History</h2>
             </div>
             {data.orders.length === 0 ? (
               <div className="p-6 text-gray-500 text-sm">No orders yet.</div>
             ) : (
               <ul className="divide-y divide-gray-100">
                 {data.orders.map((o: any) => (
                   <li key={o.id} className="p-4 flex justify-between items-center">
                     <div>
                       <p className="font-bold text-sm text-gray-900">{o.payment_reference}</p>
                       <p className="text-xs text-gray-500 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                     </div>
                     <span className={`px-2 py-1 text-xs font-bold rounded ${
                       o.status === 'dispatched' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                     }`}>
                       {o.status}
                     </span>
                   </li>
                 ))}
               </ul>
             )}
          </div>

          {/* Check-ins */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
               <h2 className="font-bold text-gray-900">Check-in Outcomes</h2>
             </div>
             {data.outcomes.length === 0 ? (
               <div className="p-6 text-gray-500 text-sm flex items-center gap-3">
                 <span>No check-ins recorded yet.</span>
                 <button className="text-blue-600 hover:underline font-medium">Trigger Check-in</button>
               </div>
             ) : (
               <ul className="divide-y divide-gray-100">
                 {data.outcomes.map((out: any) => (
                   <li key={out.id} className="p-4">
                     <div className="flex justify-between items-center">
                       <p className="font-bold text-sm text-gray-900">Week {out.check_in_week}</p>
                       <span className="text-xs text-gray-500">{new Date(out.recorded_at).toLocaleDateString()}</span>
                     </div>
                     <div className="flex items-center gap-4 mt-2">
                        <div className="bg-gray-50 px-3 py-1 rounded">
                           <span className="text-xs text-gray-500 block">Score</span>
                           <span className="font-bold text-gray-900">{out.improvement_score}/10</span>
                        </div>
                        {out.adverse_reactions && (
                          <div className="bg-red-50 text-red-700 px-3 py-1 rounded text-xs font-bold">
                             ⚠️ Adverse Reaction
                          </div>
                        )}
                     </div>
                     {out.adverse_detail && <p className="text-xs text-red-600 mt-2">{out.adverse_detail}</p>}
                   </li>
                 ))}
               </ul>
             )}
          </div>

        </div>
      </div>
    </div>
  )
}
