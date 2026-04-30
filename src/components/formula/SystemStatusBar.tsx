'use client'

// src/components/formula/SystemStatusBar.tsx
import React from 'react'
import type { ClinicalDates } from '@/lib/dates/clinicalDates'
import type { OrderState } from '@/lib/orders/orderState'
import { formatShortDate } from '@/lib/dates/clinicalDates'

interface SystemStatusBarProps {
  formulaCode: string
  clinical_dates: ClinicalDates
  order_state: OrderState
  outcomes: any[]
  isColdStart: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNextCheckpoint(clinical_dates: ClinicalDates, outcomes: any[]): { label: string; dateStr: string } {
  if (!clinical_dates.has_received) {
    return { label: 'Week 2 check-in', dateStr: 'Date set on delivery' }
  }
  
  const week2_done = outcomes.some(o => o.check_in_week === 2)
  const week4_done = outcomes.some(o => o.check_in_week === 4)
  const week8_done = outcomes.some(o => o.check_in_week === 8)

  if (!week2_done) {
    return { 
      label: 'Week 2 check-in', 
      dateStr: formatShortDate(clinical_dates.week2_date) 
    }
  }
  if (!week4_done) {
    return { 
      label: 'Week 4 check-in', 
      dateStr: formatShortDate(clinical_dates.week4_date) 
    }
  }
  if (!week8_done) {
    return { 
      label: 'Week 8 check-in', 
      dateStr: formatShortDate(clinical_dates.week8_date) 
    }
  }
  return { label: 'Formula review', dateStr: formatShortDate(clinical_dates.review_date) }
}

function getPhaseLabel(clinical_dates: ClinicalDates, order_state: OrderState, hasDueCheckin: boolean, dueCheckinWeek: number): string {
  if (hasDueCheckin) {
    return `Check-in Required — Week ${dueCheckinWeek}`
  }
  if (!clinical_dates.has_received) {
    if (order_state === 'pending_payment') return 'Protocol Setup'
    if (order_state === 'in_production') return 'Formula in Production'
    if (order_state === 'dispatched') return 'Awaiting Delivery'
    return 'Protocol Setup'
  }
  const week = Math.min(clinical_dates.week_number || 1, 8)
  return `Protocol Active — Week ${week}`
}

// ─── Data point layout ───────────────────────────────────────────────────────

function DataPoint({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <p className="text-[10px] font-bold text-[#8C7B72] dark:text-[#7A6A62] uppercase tracking-widest font-sans truncate">
        {label}
      </p>
      <div className="text-[13px] font-semibold text-[#2A0F06] dark:text-[#F0E6DF] font-sans">
        {value}
      </div>
      {sub && (
        <p className="text-[11px] text-[#8C7B72] dark:text-[#7A6A62] font-sans">{sub}</p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SystemStatusBar({
  formulaCode,
  clinical_dates,
  order_state,
  outcomes,
  isColdStart,
}: SystemStatusBarProps) {
  
  // Determine if checkin is due
  let hasDueCheckin = false
  let dueCheckinWeek = 0
  if (clinical_dates.has_received) {
    const now = new Date()
    const week2_done = outcomes.some(o => o.check_in_week === 2)
    const week4_done = outcomes.some(o => o.check_in_week === 4)
    const week8_done = outcomes.some(o => o.check_in_week === 8)

    if (!week2_done && clinical_dates.week2_date && now >= clinical_dates.week2_date) {
      hasDueCheckin = true; dueCheckinWeek = 2;
    } else if (week2_done && !week4_done && clinical_dates.week4_date && now >= clinical_dates.week4_date) {
      hasDueCheckin = true; dueCheckinWeek = 4;
    } else if (week4_done && !week8_done && clinical_dates.week8_date && now >= clinical_dates.week8_date) {
      hasDueCheckin = true; dueCheckinWeek = 8;
    }
  }

  const phaseLabel = getPhaseLabel(clinical_dates, order_state, hasDueCheckin, dueCheckinWeek)
  const nextCheckpoint = getNextCheckpoint(clinical_dates, outcomes)

  return (
    <div className="bg-[#F7F1EB] dark:bg-[#1E1410] border border-[#E8E0DA] dark:border-[#3A2820] rounded-lg px-5 py-4 mb-6">
      {/* Header label */}
      <p className="text-[9px] font-bold text-[#8C7B72] dark:text-[#7A6A62] uppercase tracking-[0.18em] font-sans mb-3">
        System Status
      </p>

      {/* 4 data points — horizontal row on desktop, 2×2 grid on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {/* 1. Phase */}
        <DataPoint
          label="Phase"
          value={phaseLabel}
        />

        {/* 2. Status — with pulsing dot */}
        <DataPoint
          label="Status"
          value={
            <span className="flex items-center gap-2">
              {hasDueCheckin ? (
                <>
                  {/* Amber pulse */}
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-toneek-amber opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-toneek-amber" />
                  </span>
                  <span className="text-toneek-amber">Check-in Required</span>
                </>
              ) : (
                <>
                  {/* Green pulse */}
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-toneek-forest opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-toneek-forest" />
                  </span>
                  <span className="text-toneek-forest dark:text-[#4caf82]">Monitoring</span>
                </>
              )}
            </span>
          }
        />

        {/* 3. Formula */}
        <DataPoint
          label="Formula"
          value={
            <span className="font-mono tracking-tight">
              {formulaCode}
            </span>
          }
          sub={isColdStart ? 'Cold Start Mode' : 'Learning Mode'}
        />

        {/* 4. Next checkpoint */}
        <DataPoint
          label="Next Checkpoint"
          value={nextCheckpoint.label}
          sub={`Available ${nextCheckpoint.dateStr}`}
        />

      </div>
    </div>
  )
}
