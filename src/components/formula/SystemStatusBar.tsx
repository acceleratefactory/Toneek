'use client'

// src/components/formula/SystemStatusBar.tsx
// System status bar for /dashboard/formula only.
// Shows 4 data points: Phase, Status (pulsing dot), Formula, Next checkpoint.
// Phase and next checkpoint calculated from assessedAt (assessment creation date).
// Status dot: green pulse = monitoring, amber pulse = check-in due.

interface SystemStatusBarProps {
  assessedAt: string        // ISO date string from assessment.created_at
  formulaCode: string
  hasDueCheckin: boolean
  dueCheckinWeek: number
  isColdStart: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CHECKIN_WEEKS = [2, 4, 8]

function getDaysSince(isoDate: string): number {
  const start = new Date(isoDate).getTime()
  const now   = Date.now()
  return Math.floor((now - start) / (1000 * 60 * 60 * 24))
}

function getPhaseLabel(days: number, hasDueCheckin: boolean, dueCheckinWeek: number): string {
  if (hasDueCheckin) {
    return `Check-in Required — Week ${dueCheckinWeek}`
  }
  // Determine current week bracket
  const week = Math.min(Math.floor(days / 7) + 1, 8)
  if (week <= 1)  return 'Protocol Active — Week 1'
  if (week <= 2)  return 'Protocol Active — Week 2'
  if (week <= 4)  return 'Protocol Active — Week 4'
  return 'Protocol Active — Week 8'
}

function getNextCheckpoint(isoDate: string, completedWeeks: number[]): { label: string; dateStr: string } {
  const start = new Date(isoDate)

  for (const week of CHECKIN_WEEKS) {
    if (completedWeeks.includes(week)) continue
    const checkDate = new Date(start.getTime() + week * 7 * 24 * 60 * 60 * 1000)
    const dateStr = checkDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return { label: `Week ${week}`, dateStr }
  }

  return { label: 'Complete', dateStr: 'All check-ins done' }
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

import React from 'react'

export default function SystemStatusBar({
  assessedAt,
  formulaCode,
  hasDueCheckin,
  dueCheckinWeek,
  isColdStart,
}: SystemStatusBarProps) {
  const days          = getDaysSince(assessedAt)
  const phaseLabel    = getPhaseLabel(days, hasDueCheckin, dueCheckinWeek)
  const nextCheckpoint = getNextCheckpoint(assessedAt, [])   // pages pass completed weeks if needed; defaults to showing next due

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
