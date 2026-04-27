'use client'

// src/components/formula/SystemUpdatedBanner.tsx
// Dismissible banner shown after check-in completion.
// Reads sessionStorage key 'toneek_checkin_complete' (value = week number).
// Clears key and hides on dismiss. Does not reappear after dismissal.
// Per toneek_final_polish.md — Phase 2.

import { useEffect, useState } from 'react'

export default function SystemUpdatedBanner() {
  const [weekNumber, setWeekNumber] = useState<string | null>(null)

  useEffect(() => {
    // Only read sessionStorage on client mount
    const val = sessionStorage.getItem('toneek_checkin_complete')
    if (val) setWeekNumber(val)
  }, [])

  const dismiss = () => {
    sessionStorage.removeItem('toneek_checkin_complete')
    setWeekNumber(null)
  }

  if (!weekNumber) return null

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 rounded-lg px-4 py-3 mb-6"
      style={{
        backgroundColor: '#E8F2EC',
        borderLeft: '3px solid #1C5C3A',
      }}
    >
      <div>
        <p
          className="text-[11px] font-bold uppercase tracking-widest font-sans mb-1"
          style={{ color: '#1C5C3A' }}
        >
          System Updated
        </p>
        <p className="text-[13px] font-sans text-[#2A4A35]">
          Your Week {weekNumber} check-in has been recorded.{' '}
          Skin OS Score and formula confidence have been updated.
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 text-[#1C5C3A] text-lg font-bold leading-none hover:opacity-70 transition-opacity mt-0.5"
      >
        ×
      </button>
    </div>
  )
}
