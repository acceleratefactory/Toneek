// src/components/formula/AdherencePlaceholder.tsx
// Shows adherence tracking section on /dashboard/formula only.
// State 1 (no outcomes): static placeholder with next check-in date.
// State 2 (outcomes exist): adherence score + amber progress bar + days estimate.
// Per toneek_final_five_upgrades.md — GAP 3.

import type { ClinicalDates } from '@/lib/dates/clinicalDates'
import { formatDate } from '@/lib/dates/clinicalDates'

interface AdherencePlaceholderProps {
  clinical_dates: ClinicalDates
  adherenceScore?: number   // 0.0–1.0 from skin_outcomes.adherence_score (undefined = no outcomes yet)
  checkinWeek?: number      // most recent check_in_week from skin_outcomes
  delayMs?: number
}

// ─── Days estimate from adherence score ──────────────────────────────────────

function getDaysLabel(score: number): string {
  if (score >= 0.9)  return '7 of 7 days applied'
  if (score >= 0.65) return '5 of 7 days applied'
  if (score >= 0.4)  return '3–4 of 7 days applied'
  return '1–2 of 7 days applied'
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdherencePlaceholder({
  clinical_dates,
  adherenceScore,
  checkinWeek,
  delayMs = 0,
}: AdherencePlaceholderProps) {
  const hasData = adherenceScore !== undefined && adherenceScore !== null

  if (!hasData) {
    // State 1 — no outcomes yet
    return (
      <div
        className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-6 py-5 shadow-sm animate-slide-up opacity-0"
        style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
      >
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-3">
          Adherence Tracking
        </p>

        <p className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-sans leading-relaxed mb-3">
          {clinical_dates.has_received ? (
            <>
              Application consistency is recorded at each check-in. Your first adherence record will be available after your Week 2 check-in on{' '}
              <span className="font-semibold text-toneek-brown dark:text-[#F0E6DF]">{formatDate(clinical_dates.week2_date)}</span>.
            </>
          ) : (
            <>
              Application consistency is recorded at each check-in. Your first adherence record will be available after your Week 2 check-in. Date confirmed on delivery.
            </>
          )}
        </p>

        <p className="text-[11px] italic text-[#8C7B72] dark:text-[#7A6A62] font-sans leading-relaxed">
          At each check-in, you will be asked how consistently you applied your formula. This data ensures your outcomes are interpreted accurately.
        </p>
      </div>
    )
  }

  // State 2 — outcomes exist, show score + bar
  const pct = Math.round((adherenceScore as number) * 100)
  const daysLabel = getDaysLabel(adherenceScore as number)

  return (
    <div
      className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-6 py-5 shadow-sm animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans">
          Adherence
        </p>
        <span className="text-[13px] font-bold text-toneek-brown dark:text-[#F0E6DF] font-sans">
          {pct}%
          {checkinWeek && (
            <span className="font-normal text-[#8C7B72] text-[11px] ml-1">
              (Week {checkinWeek} report)
            </span>
          )}
        </span>
      </div>

      {/* Amber progress bar */}
      <div className="w-full h-1.5 bg-[#E8E0DA] dark:bg-[#3A2820] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-toneek-amber rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-[11px] text-[#8C7B72] dark:text-[#7A6A62] font-sans italic">
        {daysLabel} (estimated from your reported consistency)
      </p>
    </div>
  )
}
