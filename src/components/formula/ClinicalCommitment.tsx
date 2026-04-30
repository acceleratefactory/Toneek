// src/components/formula/ClinicalCommitment.tsx
// Clinical check-in commitment tracker.
// Shows actual vs expected check-in count based on weeks active.
// Placed ABOVE AdherencePlaceholder on /dashboard/formula.
// Per toneek_final_polish.md — Phase 3.

import type { ClinicalDates } from '@/lib/dates/clinicalDates'
import { formatDate } from '@/lib/dates/clinicalDates'

interface ClinicalCommitmentProps {
  clinical_dates: ClinicalDates
  outcomes: { check_in_week: number }[] | null
  delayMs?: number
}

const CHECKIN_WEEKS = [2, 4, 8]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getExpectedCount(clinical_dates: ClinicalDates): number {
  if (!clinical_dates.has_received) return 0
  const daysActive = clinical_dates.days_since_receipt ?? 0
  
  if (daysActive < 14) return 0
  if (daysActive < 28) return 1
  if (daysActive < 56) return 2
  return 3
}

// ─── Week pill ───────────────────────────────────────────────────────────────

function WeekPill({ week, completed, due }: { week: number; completed: boolean; due: boolean }) {
  const base = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold font-sans'
  if (completed) {
    return (
      <span className={`${base} bg-toneek-amber/15 text-toneek-amber border border-toneek-amber/30`}>
        Week {week} ✓
      </span>
    )
  }
  if (due) {
    return (
      <span className={`${base} bg-[#FFF8F0] text-toneek-amber border border-toneek-amber/40`}>
        Week {week} ●
      </span>
    )
  }
  // Not yet due
  return (
    <span className={`${base} bg-[#F5F0EC] dark:bg-[#2A1C14] text-[#8C7B72] dark:text-[#6A5A52] border border-[#E8E0DA] dark:border-[#3A2820]`}>
      Week {week} —
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClinicalCommitment({
  clinical_dates,
  outcomes,
  delayMs = 0,
}: ClinicalCommitmentProps) {
  const expected      = getExpectedCount(clinical_dates)
  const actual        = outcomes?.length ?? 0
  const completedWeeks = new Set((outcomes ?? []).map(o => o.check_in_week))

  // State A — before Week 2 opens, no check-ins expected yet
  if (actual === 0 && expected === 0) {
    return (
      <div
        className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-6 py-5 shadow-sm animate-slide-up opacity-0"
        style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
      >
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-3">
          Clinical Commitment
        </p>
        <p className="text-[13px] text-gray-600 dark:text-[#C5B5AE] font-sans">
          {clinical_dates.has_received ? (
            <>Your first check-in opens at Week 2 · <span className="font-semibold text-toneek-brown dark:text-[#F0E6DF]">{formatDate(clinical_dates.week2_date)}</span></>
          ) : (
            <>Your first check-in opens at Week 2 — date confirmed when you log delivery.</>
          )}
        </p>
      </div>
    )
  }

  // Determine pill state per week
  const isOnSchedule = actual >= expected && actual > 0

  return (
    <div
      className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-6 py-5 shadow-sm animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Title */}
      <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-3">
        Clinical Commitment
      </p>

      {/* Count line */}
      <p className="text-[13px] font-semibold text-toneek-brown dark:text-[#F0E6DF] font-sans mb-2">
        Check-ins completed: {actual} / {Math.max(actual, expected)}
      </p>

      {/* Status line */}
      {isOnSchedule ? (
        <p className="text-[12px] font-semibold font-sans mb-3" style={{ color: '#1C5C3A' }}>
          ✓ On schedule
        </p>
      ) : (
        <p className="text-[12px] font-semibold font-sans text-toneek-amber mb-3">
          {expected - actual} check-in{expected - actual !== 1 ? 's' : ''} due
        </p>
      )}

      {/* Week pills */}
      <div className="flex flex-wrap gap-2">
        {CHECKIN_WEEKS.map(week => {
          const completed = completedWeeks.has(week)
          // A week is "due" if it was expected but not completed
          const weekIndex = CHECKIN_WEEKS.indexOf(week)
          const isDue = !completed && weekIndex < expected
          return (
            <WeekPill key={week} week={week} completed={completed} due={isDue} />
          )
        })}
      </div>
    </div>
  )
}
