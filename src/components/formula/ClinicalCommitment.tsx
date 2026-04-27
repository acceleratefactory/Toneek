// src/components/formula/ClinicalCommitment.tsx
// Clinical check-in commitment tracker.
// Shows actual vs expected check-in count based on weeks active.
// Placed ABOVE AdherencePlaceholder on /dashboard/formula.
// Per toneek_final_polish.md — Phase 3.

interface ClinicalCommitmentProps {
  assessedAt: string                              // ISO date — assessment creation
  outcomes: { check_in_week: number }[] | null    // all skin_outcomes records
  subscriptionStartedAt?: string | null           // from subscriptions table
  delayMs?: number
}

const CHECKIN_WEEKS = [2, 4, 8]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAnchorDate(subscriptionStartedAt: string | null | undefined, assessedAt: string): Date {
  // Prefer subscription start; fall back to assessment date
  if (subscriptionStartedAt) return new Date(subscriptionStartedAt)
  return new Date(assessedAt)
}

function getExpectedCount(anchorDate: Date): number {
  const now = new Date()
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksActive = (now.getTime() - anchorDate.getTime()) / msPerWeek

  if (weeksActive < 2) return 0
  if (weeksActive < 4) return 1
  if (weeksActive < 8) return 2
  return 3
}

function getWeek2Date(anchorDate: Date): string {
  const week2 = new Date(anchorDate.getTime() + 14 * 24 * 60 * 60 * 1000)
  return week2.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
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
  assessedAt,
  outcomes,
  subscriptionStartedAt,
  delayMs = 0,
}: ClinicalCommitmentProps) {
  const anchorDate    = getAnchorDate(subscriptionStartedAt, assessedAt)
  const expected      = getExpectedCount(anchorDate)
  const actual        = outcomes?.length ?? 0
  const completedWeeks = new Set((outcomes ?? []).map(o => o.check_in_week))

  // State A — before Week 2 opens, no check-ins expected yet
  if (actual === 0 && expected === 0) {
    const week2Date = getWeek2Date(anchorDate)
    return (
      <div
        className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-6 py-5 shadow-sm animate-slide-up opacity-0"
        style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
      >
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-3">
          Clinical Commitment
        </p>
        <p className="text-[13px] text-gray-600 dark:text-[#C5B5AE] font-sans">
          Your first check-in opens at Week 2 ·{' '}
          <span className="font-semibold text-toneek-brown dark:text-[#F0E6DF]">{week2Date}</span>
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
