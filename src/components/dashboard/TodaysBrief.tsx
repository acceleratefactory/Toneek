'use client'

// src/components/dashboard/TodaysBrief.tsx
import React, { useState } from 'react'
import type { ClinicalDates } from '@/lib/dates/clinicalDates'
import type { OrderState } from '@/lib/orders/orderState'

interface TodaysBriefProps {
  order_state: OrderState
  order: {
    id?: string
    payment_reference?: string
    courier?: string
    tracking_number?: string
    tracking_url?: string
    received_at?: string
  }
  clinical_dates: ClinicalDates
  assessment: {
    primary_concern: string
    formula_tier: string | null
    analysis_scores: Record<string, number> | null
  }
  outcomes: any[]
}

export default function TodaysBrief({
  order_state,
  order,
  clinical_dates,
  assessment,
  outcomes,
}: TodaysBriefProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogDelivery = async () => {
    if (!order.id) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/orders/log-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          received_date: selectedDate,
        }),
      })
      if (res.ok) {
        // Refresh page to pull new dates from server component
        window.location.reload()
      } else {
        console.error('Failed to log delivery')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine if check-in is due now based on active_protocol
  const checkinDue = (() => {
    if (order_state !== 'active_protocol') return null
    if (!clinical_dates.has_received) return null
    const now = new Date()
    const week2_done = outcomes.some(o => o.check_in_week === 2)
    const week4_done = outcomes.some(o => o.check_in_week === 4)
    const week8_done = outcomes.some(o => o.check_in_week === 8)

    if (!week2_done && clinical_dates.week2_date && now >= clinical_dates.week2_date) return 2
    if (week2_done && !week4_done && clinical_dates.week4_date && now >= clinical_dates.week4_date) return 4
    if (week4_done && !week8_done && clinical_dates.week8_date && now >= clinical_dates.week8_date) return 8
    return null
  })()

  // State configurations
  const indicators = {
    pending_payment: { text: 'PENDING PAYMENT', bg: '#D4700A', textColor: '#FFFFFF' },
    in_production: { text: 'IN PRODUCTION', bg: '#C87D3E', textColor: '#FFFFFF' },
    dispatched: { text: 'DISPATCHED', bg: '#C87D3E', textColor: '#FFFFFF', pulse: true },
    active_protocol: checkinDue 
      ? { text: 'CHECK-IN DUE', bg: '#D4700A', textColor: '#FFFFFF', pulse: true }
      : { text: 'ON TRACK', bg: '#1C5C3A', textColor: '#FFFFFF', pulse: true },
    no_order: { text: 'NOT STARTED', bg: '#8C7B72', textColor: '#FFFFFF' },
  }

  const indicator = indicators[order_state] || indicators.no_order

  // Render left column content
  const renderLeftColumn = () => {
    if (order_state === 'pending_payment' || order_state === 'no_order') {
      return (
        <>
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: '#F7F1EB' }}>
            Complete your payment to begin production.<br />
            Transfer your payment to your designated account.<br />
            {order.payment_reference && `Use reference: ${order.payment_reference}`}
          </p>
        </>
      )
    }
    if (order_state === 'in_production') {
      return (
        <>
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: '#F7F1EB' }}>
            Your formula is being compounded.<br />
            Application begins on delivery.<br />
            You will receive a WhatsApp notification when dispatched.
          </p>
        </>
      )
    }
    if (order_state === 'dispatched') {
      return (
        <>
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: '#F7F1EB' }}>
            Your formula is on its way.<br />
            {order.courier && `Courier: ${order.courier}`}<br />
            {order.tracking_number && `Tracking: ${order.tracking_number}`}<br />
            {order.tracking_url && (
              <a href={order.tracking_url} target="_blank" rel="noreferrer" className="underline text-toneek-amber mt-1 inline-block">
                Track your delivery →
              </a>
            )}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="border border-[#C87D3E] text-[#C87D3E] text-[13px] font-bold px-4 py-2 rounded hover:bg-[#C87D3E] hover:text-white transition-colors"
          >
            Log delivery when received
          </button>
        </>
      )
    }
    // active_protocol
    if (checkinDue) {
      return (
        <>
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: '#F7F1EB' }}>
            Complete your Week {checkinDue} check-in — your next order depends on it.
          </p>
          <a href={`/dashboard/checkin?week=${checkinDue}`} className="inline-block bg-[#C87D3E] text-white text-[13px] font-bold px-4 py-2 rounded">
            Complete check-in now
          </a>
        </>
      )
    }
    const tier = assessment.formula_tier
    const text = tier === 'restoration' 
      ? 'Apply your formula morning and evening. 0.5ml each application.'
      : 'Apply your formula tonight at bedtime. 0.5ml — pea-sized amount.'
    return <p className="text-[14px] leading-relaxed mb-4" style={{ color: '#F7F1EB' }}>{text}</p>
  }

  // Render right column content
  const renderRightColumn = () => {
    if (order_state === 'pending_payment' || order_state === 'no_order') {
      return (
        <>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#C87D3E' }}>Next Checkpoint</p>
          <p className="text-[14px] font-semibold leading-snug mb-1" style={{ color: '#F7F1EB' }}>
            Your clinical journey begins on delivery.
          </p>
          <p className="text-[12px] mb-6" style={{ color: '#8C7B72' }}>
            Production starts on payment confirmation.
          </p>
        </>
      )
    }
    if (order_state === 'in_production') {
      return (
        <>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#C87D3E' }}>Next Checkpoint</p>
          <p className="text-[14px] font-semibold leading-snug mb-1" style={{ color: '#F7F1EB' }}>
            Your clinical journey begins on delivery.
          </p>
          <p className="text-[12px] mb-6" style={{ color: '#8C7B72' }}>
            Week 2 check-in date will be set from delivery date.
          </p>
        </>
      )
    }
    if (order_state === 'dispatched') {
      return (
        <>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#C87D3E' }}>Next Checkpoint</p>
          <p className="text-[14px] font-semibold leading-snug mb-1" style={{ color: '#F7F1EB' }}>
            Week 2 check-in — date set when you log delivery
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2 mt-6" style={{ color: '#C87D3E' }}>Expected This Week</p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#D4C5BE' }}>
            Log your delivery when your formula arrives — your clinical timeline starts that day.
          </p>
        </>
      )
    }

    // active_protocol
    const { week2_date, week4_date, week8_date, review_date } = clinical_dates
    const week2_done = outcomes.some(o => o.check_in_week === 2)
    const week4_done = outcomes.some(o => o.check_in_week === 4)
    const week8_done = outcomes.some(o => o.check_in_week === 8)

    let checkpointLabel = 'All check-ins complete.'
    let checkpointSub = 'Formula review available.'
    if (!week2_done) {
      checkpointLabel = `Week 2 check-in`
      checkpointSub = `Available ${week2_date ? new Date(week2_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Date confirmed on delivery'}`
    } else if (!week4_done) {
      checkpointLabel = `Week 4 check-in`
      checkpointSub = `Available ${week4_date ? new Date(week4_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}`
    } else if (!week8_done) {
      checkpointLabel = `Week 8 check-in`
      checkpointSub = `Available ${week8_date ? new Date(week8_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}`
    }

    // Expected this week logic for active protocol
    const daysActive = clinical_dates.days_since_receipt ?? 0
    let expectedText = 'Protocol initiated. First measurable changes visible at Week 2 check-in.'
    const concern = (assessment.primary_concern || '').toLowerCase()
    if (daysActive >= 56) {
      expectedText = `Protocol cycle complete. Formula review available.`
    } else if (daysActive >= 29) {
      expectedText = 'Approaching Week 8 assessment. This is your primary clinical milestone. Skin OS Score recalculates at Week 8.'
    } else if (daysActive >= 15) {
      if (concern === 'pih' || concern === 'tone') {
        expectedText = 'Melanin transfer reduction underway. Week 4 is your first visible pigmentation milestone.'
      } else {
        expectedText = 'Protocol holding. Week 4 check-in will show first measurable improvement data.'
      }
    } else if (daysActive >= 8) {
      expectedText = 'Skin calming measurably. Complete your Week 2 check-in to record your progress and release your next order.'
    } else {
      if (concern === 'pih' || concern === 'tone') expectedText = 'Surface inflammation calming. No visible pigment change yet — this is normal and expected at Week 1.'
      else if (concern === 'acne') expectedText = 'Follicular exfoliation beginning. Mild initial purging can occur and is expected. It subsides by Day 10.'
      else if (concern === 'dryness') expectedText = 'Barrier repair actives at work. Tightness should reduce within 7–10 days.'
      else if (concern === 'sensitivity') expectedText = 'Calming actives reducing reactivity. Mild tingling normalises by Day 5.'
    }

    const barrierIntegrity = assessment.analysis_scores?.barrier_integrity ?? 60
    let emotionalText = 'Your formula stabilises the barrier first. This is the foundation for lasting improvement.'
    let emotionalColour = barrierIntegrity >= 70 ? '#1C5C3A' : '#C87D3E'
    if (daysActive > 28) {
      emotionalText = 'Approaching your primary milestone. Week 8 recalculates your Skin OS Score.'
    } else if (daysActive > 14) {
      emotionalText = 'You are in the active treatment phase. First visible changes are beginning.'
    } else if (barrierIntegrity >= 80) {
      emotionalText = `${assessment.primary_concern || 'Your primary concern'} is the formula's primary target — your barrier is already working well for you.`
    }

    return (
      <>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#C87D3E' }}>Next Checkpoint</p>
        {checkinDue ? (
          <a href={`/dashboard/checkin?week=${checkinDue}`} className="text-[14px] font-semibold leading-snug mb-1 hover:underline transition-opacity block" style={{ color: '#C87D3E' }}>
            Week {checkinDue} check-in is open now
          </a>
        ) : (
          <p className="text-[14px] font-semibold leading-snug mb-1" style={{ color: '#F7F1EB' }}>{checkpointLabel}</p>
        )}
        <p className="text-[12px] mb-6" style={{ color: '#8C7B72' }}>{checkinDue ? 'Complete it to release your next order.' : checkpointSub}</p>

        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#C87D3E' }}>Expected This Week</p>
        <p className="text-[13px] font-semibold leading-snug mb-2" style={{ color: emotionalColour }}>{emotionalText}</p>
        <p className="text-[13px] leading-relaxed" style={{ color: '#D4C5BE' }}>{expectedText}</p>
      </>
    )
  }

  return (
    <>
      {/* State 4 Banner: Prompt to log delivery if dispatched */}
      {order_state === 'dispatched' && (
        <div className="bg-toneek-amber/10 border border-toneek-amber/30 w-full p-4 rounded-xl mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-[13px] text-toneek-brown font-medium">
            <strong className="block mb-1">Has your formula arrived?</strong>
            Log your delivery to start your treatment protocol and set your check-in dates.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="whitespace-nowrap bg-toneek-amber text-white font-bold text-[13px] px-5 py-2.5 rounded-lg hover:bg-toneek-amber/90 transition-colors shadow-sm"
          >
            I received my formula
          </button>
        </div>
      )}

      <div className="w-full rounded-xl px-8 py-6 font-sans relative" style={{ backgroundColor: '#2A0F06' }}>
        
        {/* Header and Indicator */}
        <div className="flex justify-between items-start mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#C87D3E' }}>
            Today {clinical_dates.week_number ? `· Week ${clinical_dates.week_number}` : ''}
          </p>
          <div 
            className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest"
            style={{ backgroundColor: indicator.bg, color: indicator.textColor }}
          >
            {'pulse' in indicator && indicator.pulse && (
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
            )}
            {indicator.text}
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#C87D3E' }}>Do Today</p>
            {renderLeftColumn()}
          </div>
          <div>
            {renderRightColumn()}
          </div>
        </div>
      </div>

      {/* Log Delivery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1210] p-6 rounded-xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-[#3A2820]">
            <h3 className="text-xl font-bold text-toneek-brown dark:text-white mb-2">Log formula delivery</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Confirm when you received your formula. Your Week 2, 4, and 8 check-in dates will be calculated from this day.
            </p>
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                Date Received
              </label>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-gray-200 dark:border-[#3A2820] rounded-lg bg-gray-50 dark:bg-black text-toneek-brown dark:text-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Cannot log future date
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-[13px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleLogDelivery}
                className="px-6 py-2 bg-toneek-amber text-white text-[13px] font-bold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Confirm delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
