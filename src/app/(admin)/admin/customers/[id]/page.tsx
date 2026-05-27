import React from 'react'
import { adminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ChemistReviewForm from '@/components/admin/ChemistReviewForm'
import ConcernReviewPanel from '@/components/admin/ConcernReviewPanel'
import ChemistCopilotPanel from '@/components/admin/ChemistCopilotPanel'
import DarkPeriodPanel from '@/components/admin/DarkPeriodPanel'
import DeliveryLinkGenerator from '@/components/admin/DeliveryLinkGenerator'

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

  // Fetch concern reports (includes review_status, admin_clinical_note, reviewed_by, reviewed_at from Task A)
  const { data: concerns } = await adminClient
    .from('concern_reports')
    .select('*')
    .eq('user_id', id)
    .order('submitted_at', { ascending: false })

  // Fetch clinical notes
  const { data: notes } = await adminClient
    .from('clinical_notes')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Fetch dark period responses
  const { data: darkPeriod } = await adminClient
    .from('dark_period_responses')
    .select('*')
    .eq('user_id', id)
    .order('day_number', { ascending: true })

  // Fetch platform settings for delivery fees
  const { data: settings } = await adminClient
    .from('platform_settings')
    .select('delivery_fees')
    .single()

  // Fetch communication logs
  const { data: commLogs } = await adminClient
    .from('communication_logs')
    .select('*')
    .eq('user_id', id)
    .order('sent_at', { ascending: false })
    .limit(5)

  // Fetch delivery links
  const orderIds = orders?.map(o => o.id) || []
  let deliveryLinks: any[] = []
  if (orderIds.length > 0) {
    const { data: links } = await adminClient
      .from('delivery_payment_links')
      .select('*')
      .in('order_id', orderIds)
    if (links) deliveryLinks = links
  }

  const timeline: any[] = []

  assessments?.forEach((a: any) => {
    timeline.push({
      id: `a_${a.id}`,
      date: new Date(a.created_at),
      type: 'assessment',
      title: 'Assessment & Formula Assigned',
      description: `Formula ${a.formula_code} assigned. Risk score: ${a.risk_score}`,
      icon: '📝',
      iconBg: 'bg-blue-100 text-blue-600'
    })
  })

  orders?.forEach((o: any) => {
    timeline.push({
      id: `o_${o.id}`,
      date: new Date(o.created_at),
      type: 'order',
      title: `Order ${o.payment_reference}`,
      description: `Status: ${o.order_type === 'free_trial' ? 'Free trial' : 'Paid'}. Tier: ${o.routine_tier}`,
      icon: '📦',
      iconBg: 'bg-toneek-sage text-toneek-forest'
    })

    if (o.production_completed_at) {
      timeline.push({
        id: `pc_${o.id}`,
        date: new Date(o.production_completed_at),
        type: 'production_completed',
        title: 'Production Completed',
        description: `Formula ${assessments?.[0]?.formula_code || 'assigned'} compounded. Ready for dispatch.`,
        icon: '⚗️',
        iconBg: 'bg-indigo-100 text-indigo-600'
      })
    }

    if (o.dispatched_at) {
      timeline.push({
        id: `dp_${o.id}`,
        date: new Date(o.dispatched_at),
        type: 'dispatched',
        title: 'Formula Dispatched',
        description: o.tracking_number ? `Tracking: ${o.tracking_number}` : 'Dispatched without tracking number.',
        icon: '🚚',
        iconBg: 'bg-blue-100 text-blue-600'
      })
    }

    // Add delivery fee paid event for free trial orders
    if (o.order_type === 'free_trial' && o.payment_status === 'confirmed' && o.payment_confirmed_at && o.delivery_fee !== null) {
      const symbol = o.delivery_fee_currency === 'NGN' ? '₦' : o.delivery_fee_currency === 'GBP' ? '£' : o.delivery_fee_currency === 'USD' ? '$' : o.delivery_fee_currency
      timeline.push({
        id: `df_${o.id}`,
        date: new Date(o.payment_confirmed_at),
        type: 'delivery_fee_paid',
        title: 'Delivery fee confirmed',
        description: `${symbol}${o.delivery_fee} delivery payment confirmed. Formula cost: waived (free trial).`,
        icon: '✅',
        iconBg: 'bg-[#1C5C3A] text-white'
      })
    }

    if (o.received_at) {
      timeline.push({
        id: `rc_${o.id}`,
        date: new Date(o.received_at),
        type: 'received',
        title: 'Customer Logged Delivery',
        description: 'Clinical protocol started. Week 2/4/8 check-in timeline begins.',
        icon: '🎯',
        iconBg: 'bg-[#C87D3E] text-white'
      })
    }
  })

  outcomes?.forEach((o: any) => {
    timeline.push({
      id: `oc_${o.id}`,
      date: new Date(o.recorded_at),
      type: 'checkin',
      title: `Week ${o.check_in_week} Check-in`,
      description: `Score: ${o.improvement_score}/10. ${o.adverse_reactions ? 'Adverse reaction reported.' : 'No adverse reactions.'}`,
      icon: '✅',
      iconBg: o.adverse_reactions ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
    })
  })

  // Phase I: Concern events are review_status-aware
  concerns?.forEach((c: any) => {
    const isPending   = c.review_status === 'pending_review'
    const isReleased  = c.review_status === 'released_protocol_failure'
    const isConfirmed = c.review_status === 'confirmed_incompatibility'

    let outcomeText = ''
    if (isReleased)  outcomeText = `✅ Released by admin — Protocol Failure. Note: ${c.admin_clinical_note ?? '—'}`
    if (isConfirmed) outcomeText = '🚫 Confirmed incompatibility — Formula permanently blacklisted.'

    timeline.push({
      id: `c_${c.id}`,
      date: new Date(c.submitted_at),
      type: 'concern',
      title: isPending ? '🚨 Emergency Concern — Pending Clinical Review' : 'Emergency Concern Report',
      description: `Day ${c.day_of_protocol ?? '?'}: ${c.suspected_product} (${c.severity}). ${outcomeText || 'System triggered safe-formula override.'}`,
      icon: isPending ? '⏳' : '🚨',
      iconBg: isPending ? 'bg-amber-100 text-amber-700' : isReleased ? 'bg-green-100 text-green-700' : 'bg-red-600 text-white',
      raw: c, // pass full concern object so ConcernReviewPanel can render
    })
  })

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime())

  // Task B: Build a map of formula_code → most recent review_status from this user's concerns.
  // Concerns are already ordered newest-first so the first entry per formula wins.
  const formulaStatusMap: Record<string, string> = {}
  concerns?.forEach((c: any) => {
    if (c.formula_code && !formulaStatusMap[c.formula_code]) {
      formulaStatusMap[c.formula_code] = c.review_status ?? 'pending_review'
    }
  })

  return {
    profile,
    assessments: assessments ?? [],
    orders: orders ?? [],
    outcomes: outcomes ?? [],
    timeline,
    formulaStatusMap,
    notes: notes ?? [],
    darkPeriod: darkPeriod ?? [],
    deliveryFees: settings?.delivery_fees ?? {},
    communicationLogs: commLogs ?? [],
    deliveryLinks
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
      
      {/* ── Top Header Banner (Zoho Style) ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative pb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-toneek-cream border border-toneek-lightgray text-toneek-brown rounded flex items-center justify-center font-bold text-xl shadow-sm">
              {data.profile.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{data.profile.full_name}</h1>
              <p className="text-sm text-gray-500 mt-1">{data.profile.email} • {data.profile.phone ?? 'No phone'}</p>
              <div className="flex gap-2 mt-3">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                   data.profile.subscription_status === 'active' ? 'bg-toneek-sage text-toneek-forest' : 'bg-toneek-cream text-toneek-brown border border-toneek-lightgray'
                 }`}>
                   Status: {data.profile.subscription_status}
                 </span>
                 {latestAssessment && (
                   <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-toneek-cream text-toneek-brown border border-toneek-lightgray font-mono">
                     Formula: {latestAssessment.formula_code ?? 'Pending'}
                   </span>
                 )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
             <a href={`https://wa.me/${data.profile.phone?.replace('+', '')}`} target="_blank" className="bg-toneek-forest hover:bg-[#144229] text-white px-4 py-2 rounded-md font-bold text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
               <span>💬</span> WhatsApp
             </a>
             <button className="bg-toneek-brown hover:bg-[#1A1210] text-white px-4 py-2 rounded-md font-bold text-sm transition-colors border-none shadow-sm">
               Update Formula
             </button>
          </div>
        </div>
      </div>

      {/* ── PRIORITY BANNER ── */}
      {isFlagged && (data.profile.subscription_tier === 'full_protocol' || data.profile.subscription_tier === 'restoration') && (
        <div className="bg-[#FEF3E2] border-l-4 border-[#C87D3E] p-4 rounded-r-xl shadow-sm mb-6">
          <p className="text-[#C87D3E] font-bold text-sm">
            PRIORITY REFORMULATION · Full Protocol subscriber · Target response within 48 hours
          </p>
        </div>
      )}

      {/* ── ALERTS / FLAGS ── */}
      {isFlagged && (
        <div className={`${latestAssessment.flag_reason?.includes('Chemist') ? 'bg-red-900 border-red-950 text-white' : 'bg-toneek-errorbg border-toneek-error'} rounded-xl p-5 shadow-sm`}>
          <h2 className={`${latestAssessment.flag_reason?.includes('Chemist') ? 'text-red-200' : 'text-toneek-error'} font-bold flex items-center gap-2`}>
            {latestAssessment.flag_reason?.includes('Chemist') ? '🚨 Chemist Review Required' : '⚠️ Assessment Flagged For Review'}
          </h2>
          <p className={`${latestAssessment.flag_reason?.includes('Chemist') ? 'text-white' : 'text-toneek-error'} mt-2 text-sm`}>
            Reason: <span className="font-bold">{latestAssessment.flag_reason}</span>
          </p>
          <div className="mt-4 flex gap-3 flex-wrap">
             {latestAssessment.flag_reason?.includes('Chemist') ? (
               <ChemistReviewForm userId={data.profile.id} defaultFormula={latestAssessment.formula_code} />
             ) : (
               <button className="bg-toneek-error hover:bg-[#A03226] text-white px-4 py-2 text-xs font-bold rounded shadow-sm">Trigger Dermatology Bridge</button>
             )}
             {!latestAssessment.flag_reason?.includes('Chemist') && (
               <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 text-xs font-bold rounded shadow-sm">Clear Flag</button>
             )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-8">
          
          {/* Shipping & Contact */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
               <h2 className="font-bold text-gray-900">Shipping & Contact</h2>
             </div>
             <div className="p-6">
                <p className="text-sm text-gray-800 mb-3"><span className="font-semibold text-gray-500 w-16 inline-block">Phone:</span> {data.profile.phone || 'No phone on file'}</p>
                <div className="text-sm text-gray-800">
                  <span className="font-semibold text-gray-500 block mb-1">Address:</span>
                  {data.profile.address ? (
                    <div className="pl-4 border-l-2 border-gray-100">
                      {data.profile.address}<br />
                      {data.profile.city && <>{data.profile.city}<br /></>}
                      {data.profile.state && <>{data.profile.state}</>}
                    </div>
                  ) : (
                    <span className="italic text-gray-400">No address on file</span>
                  )}
                </div>
             </div>
          </div>
          {/* Chemist Notes (Global) */}
          {(data.profile as any).chemist_notes && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-red-900 flex items-center gap-2 mb-3">
                <span className="text-xl">🩺</span> Chemist Clinical Notes
              </h2>
              <div className="text-sm text-red-800 whitespace-pre-wrap leading-relaxed font-medium">
                {(data.profile as any).chemist_notes}
              </div>
            </div>
          )}

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
                    <p className="font-mono font-bold text-lg text-toneek-brown">{latestAssessment.formula_code}</p>
                    <p className="text-gray-600 mt-2 bg-gray-50 p-3 rounded">{latestAssessment.formula_rationale}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                       <span className="text-gray-500">Skin OS Score:</span><br/>
                       <span className="text-2xl font-black text-gray-900">{latestAssessment.skin_os_score}/100</span>
                    </div>
                    <div className="text-right">
                       <span className="text-gray-500">Risk Score:</span><br/>
                       <span className={`text-xl font-black ${latestAssessment.risk_score > 0 ? 'text-toneek-error' : 'text-toneek-forest'}`}>
                         {latestAssessment.risk_score}
                       </span>
                    </div>
                  </div>

                  {/* Blacklisted Formulas â€” Task B: badge-aware rendering */}
                   {latestAssessment.adverse_formula_history && latestAssessment.adverse_formula_history.length > 0 && (
                     <div className="pt-4 border-t border-gray-100">
                       <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                         <span className="text-sm">&#x1F6AB;</span> Clinical Blacklist
                       </p>
                       <div className="flex flex-wrap gap-2">
                         {[...new Set(latestAssessment.adverse_formula_history as string[])].map((code: string, i: number) => {
                           const status      = data.formulaStatusMap[code]
                           const isReleased  = status === 'released_protocol_failure'
                           const isConfirmed = status === 'confirmed_incompatibility'
                           const isPending   = !isReleased && !isConfirmed
                           return (
                             <div key={i} className="flex items-center gap-1.5">
                               <span className={`px-2.5 py-1 text-xs font-bold rounded border shadow-sm font-mono ${
                                 isReleased  ? 'bg-green-50 text-green-800 border-green-200' :
                                 isPending   ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                               'bg-red-50 text-red-700 border-red-200'
                               }`}>
                                 {code}
                               </span>
                               {isReleased && (
                                 <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200">
                                   Released
                                 </span>
                               )}
                               {isPending && (
                                 <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                                   Under Review
                                 </span>
                               )}
                               {isConfirmed && (
                                 <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-200">
                                   Confirmed
                                 </span>
                               )}
                             </div>
                           )
                         })}
                       </div>
                       <p className="text-xs text-gray-400 mt-3">
                         {[...new Set(latestAssessment.adverse_formula_history as string[])].every(
                           (code: string) => data.formulaStatusMap[code] === 'released_protocol_failure'
                         )
                           ? 'All holds lifted â€” formulas are cleared for re-assignment by the engine.'
                           : 'Confirmed formulas will not be automatically re-assigned to this customer.'}
                       </p>
                     </div>
                   )}
               </div>
            </div>
          )}

          {/* Dark Period Check-ins */}
          <DarkPeriodPanel responses={data.darkPeriod} />

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
                   <React.Fragment key={o.id}>
                   <li className="p-4 flex justify-between items-center">
                     <div>
                       <p className="font-bold text-sm text-gray-900 font-mono">{o.payment_reference}</p>
                       <p className="text-xs text-gray-500 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                     </div>
                     <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${
                       o.status === 'dispatched' ? 'bg-toneek-sage text-toneek-forest border-toneek-sage' : 'bg-toneek-cream text-toneek-brown border-toneek-lightgray'
                     }`}>
                       {o.status}
                     </span>
                   </li>
                   
                   {/* Delivery Link Generator for free_trial orders without a delivery fee paid */}
                   {o.order_type === 'free_trial' && o.payment_status !== 'confirmed' && (
                     <li key={`${o.id}-delivery`} className="p-4 bg-gray-50/50 border-t border-gray-100">
                       {(() => {
                         const existingLink = data.deliveryLinks.find((l: any) => l.order_id === o.id)
                         if (existingLink && !existingLink.used_at) {
                           // Link generated but unpaid - show it permanently
                           const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toneek.com'
                           const fullLink = `${baseUrl}/pay-delivery?token=${existingLink.token}`
                           const symbol = existingLink.currency === 'NGN' ? '₦' : existingLink.currency === 'GBP' ? '£' : existingLink.currency === 'USD' ? '$' : existingLink.currency
                           
                           const firstName = data.profile.full_name?.split(' ')[0] || 'Customer'
                           const phone = data.profile.phone ? data.profile.phone.replace('+', '') : ''
                           
                           const message = `Hi ${firstName},\n\nYour personalised Toneek formula is ready! 🎉\n\nTo receive your delivery, please make a small delivery payment:\n${symbol}${existingLink.delivery_fee?.toLocaleString()} to the details on this page:\n\n${fullLink}\n\nYour formula will be dispatched as soon as payment is confirmed.`
                           const encodedMessage = encodeURIComponent(message)
                           const emailSubject = encodeURIComponent("Your free Toneek formula is ready for dispatch!")
                           
                           return (
                             <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                               <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Delivery Payment Pending</p>
                               <p className="text-sm text-amber-900 mb-3">Link generated for {symbol}{existingLink.delivery_fee?.toLocaleString()}</p>
                               <div className="flex gap-2 mb-3">
                                 <input type="text" readOnly value={fullLink} className="flex-1 bg-white border border-amber-200 rounded-md px-3 py-2 text-sm font-mono text-amber-900 outline-none" />
                               </div>
                               <p className="text-xs text-amber-700 italic mb-3">This link will remain active here until the customer completes the payment.</p>
                               
                               <details className="group">
                                 <summary className="text-xs font-bold text-amber-800 cursor-pointer hover:underline outline-none list-none [&::-webkit-details-marker]:hidden flex items-center gap-1 select-none">
                                   <span className="group-open:hidden">▶ Show sharing options</span>
                                   <span className="hidden group-open:inline">▼ Hide sharing options</span>
                                 </summary>
                                 <div className="flex gap-3 mt-3 pt-3 border-t border-amber-200/50">
                                   <a 
                                     href={`https://wa.me/${phone}?text=${encodedMessage}`}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-2 rounded-md font-bold text-xs transition-colors shadow-sm"
                                   >
                                     <span>💬</span> WhatsApp
                                   </a>
                                   <a 
                                     href={`mailto:?subject=${emailSubject}&body=${encodedMessage}`}
                                     className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 py-2 rounded-md font-bold text-xs transition-colors shadow-sm"
                                   >
                                     ✉️ Email
                                   </a>
                                 </div>
                               </details>
                             </div>
                           )
                         } else if (!existingLink) {
                           // No link generated yet - show generator
                           return (
                             <DeliveryLinkGenerator 
                               orderId={o.id}
                               customerName={data.profile.full_name}
                               formulaCode={data.assessments[0]?.formula_code}
                               planTier={o.plan_tier}
                               paymentReference={o.payment_reference}
                               customerPhone={data.profile.phone}
                             />
                           )
                         }
                         return null // If link is used, show nothing
                       })()}
                     </li>
                   )}
                 </React.Fragment>
                 ))}
               </ul>
             )}
          </div>

          {/* Subscription Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
               <h2 className="font-bold text-gray-900">Subscription Status</h2>
             </div>
             <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">Status</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    data.profile.subscription_status === 'active' ? 'bg-toneek-sage text-toneek-forest' : 'bg-toneek-cream text-toneek-brown border border-toneek-lightgray'
                  }`}>
                    {data.profile.subscription_status === 'trialing' ? 'TRIAL' : (data.profile.subscription_status || 'N/A')}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <span className="text-sm font-semibold text-gray-600">Delivery Fee</span>
                  {data.orders[0] && data.orders[0].delivery_fee !== null && data.orders[0].payment_status === 'confirmed' ? (
                    <span className="px-3 py-1 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                      {data.orders[0].delivery_fee_currency === 'NGN' ? '₦' : data.orders[0].delivery_fee_currency === 'GBP' ? '£' : data.orders[0].delivery_fee_currency === 'USD' ? '$' : (data.orders[0].delivery_fee_currency || '')}{data.orders[0].delivery_fee?.toLocaleString()} paid
                    </span>
                  ) : data.orders[0] && data.orders[0].delivery_fee !== null && data.orders[0].payment_status !== 'confirmed' ? (
                    <span className="px-3 py-1 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                      {data.orders[0].delivery_fee_currency === 'NGN' ? '₦' : data.orders[0].delivery_fee_currency === 'GBP' ? '£' : data.orders[0].delivery_fee_currency === 'USD' ? '$' : (data.orders[0].delivery_fee_currency || '')}{data.orders[0].delivery_fee?.toLocaleString()} Pending
                    </span>
                  ) : data.orders[0]?.order_type === 'free_trial' ? (
                    <span className="px-3 py-1 rounded bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200">
                      Not Generated
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded bg-gray-50 text-gray-500 text-xs font-bold border border-gray-200">N/A</span>
                  )}
                </div>
             </div>
          </div>

          {/* Communication Log */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
               <h2 className="font-bold text-gray-900">Communication Log</h2>
             </div>
             {data.communicationLogs.length === 0 ? (
               <div className="p-6 text-gray-500 text-sm">No communications logged yet.</div>
             ) : (
               <ul className="divide-y divide-gray-100">
                 {data.communicationLogs.map((log: any) => (
                   <li key={log.id} className="p-4 flex gap-3 items-start">
                     <span className="text-xl">{log.channel === 'whatsapp' ? '💬' : '✉️'}</span>
                     <div>
                       <p className="font-bold text-sm text-gray-900 capitalize">{log.message_type.replace(/_/g, ' ')}</p>
                       <p className="text-xs text-gray-500 mt-1">{log.channel} · {new Date(log.sent_at).toLocaleString()}</p>
                     </div>
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
                 <button className="text-toneek-brown hover:underline font-bold">Trigger Check-in</button>
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
                          <div className="bg-toneek-errorbg text-toneek-error border border-toneek-errorbg px-3 py-1 rounded text-xs font-bold">
                             ⚠️ Adverse Reaction
                          </div>
                        )}
                     </div>
                     {out.adverse_detail && <p className="text-xs text-toneek-error mt-2">{out.adverse_detail}</p>}
                   </li>
                 ))}
               </ul>
             )}
          </div>

          {/* Clinical Journey Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
               <h2 className="font-bold text-gray-900">Clinical Journey Timeline</h2>
             </div>
             <div className="p-6">
               {data.timeline.length === 0 ? (
                 <div className="text-gray-500 text-sm">No clinical events recorded yet.</div>
               ) : (
                 <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 py-2">
                   {data.timeline.map((event: any) => (
                     <div key={event.id} className="relative pl-6">
                       <div className={`absolute -left-3.5 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-sm ring-4 ring-white ${event.iconBg}`}>
                         {event.icon}
                       </div>
                       <div>
                         <p className="text-[11px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">{event.date.toLocaleString()}</p>
                         <p className="font-bold text-sm text-gray-900">{event.title}</p>
                         <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                         {/* Phase I: Admin review panel — only shows for pending concerns */}
                         {event.type === 'concern' && event.raw?.review_status === 'pending_review' && (
                           <ConcernReviewPanel
                             concernId={event.raw.id}
                             formulaCode={event.raw.formula_code ?? 'Unknown'}
                             customerName={data.profile.full_name ?? 'Customer'}
                           />
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

          {/* Chemist Copilot Panel */}
          <ChemistCopilotPanel customerId={id} initialNotes={data.notes} />

        </div>
      </div>
    </div>
  )
}
