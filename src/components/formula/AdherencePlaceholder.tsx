import type { ClinicalDates } from '@/lib/dates/clinicalDates'
import { formatDate } from '@/lib/dates/clinicalDates'

interface AdherencePlaceholderProps {
  clinical_dates: ClinicalDates
  outcome_by_week: Record<number, any>
  delayMs?: number
}

// ─── Days estimate from adherence score ──────────────────────────────────────

function adherenceToDisplay(score: number | null | undefined) {
  if (score === null || score === undefined) return null
  const pct = Math.round(score * 100)
  const days = score >= 0.9 ? '6–7' : score >= 0.7 ? '5–6' : score >= 0.5 ? '3–4' : '1–2'
  return { pct, days }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdherencePlaceholder({
  clinical_dates,
  outcome_by_week,
  delayMs = 0,
}: AdherencePlaceholderProps) {
  const week2 = outcome_by_week[2]
  const week4 = outcome_by_week[4]
  const week8 = outcome_by_week[8]

  // State 1 — no outcomes yet
  if (!week2 && !week4 && !week8) {
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

  // State 2 — outcomes exist, show tracking history
  const adh = adherenceToDisplay(week2?.adherence_score)

  return (
    <div
      className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-6 py-5 shadow-sm animate-slide-up opacity-0 flex flex-col justify-between"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      <div>
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-4">
          ADHERENCE TRACKING
        </p>

        {/* Week 2 adherence */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-medium">Week 2 consistency</span>
            <span className="text-[13px] font-bold text-toneek-brown dark:text-[#F0E6DF]">
              {adh ? `${adh.pct}%` : 'Not recorded'}
            </span>
          </div>
          {adh && (
            <>
              <div className="w-full h-1.5 bg-[#E8E0DA] dark:bg-[#3A2820] rounded-full overflow-hidden mb-1.5">
                <div 
                  className="h-full bg-toneek-amber rounded-full"
                  style={{ width: `${adh.pct}%` }}
                />
              </div>
              <p className="text-[11px] text-[#8C7B72] dark:text-[#7A6A62] italic">
                {adh.days} days of consistent application reported
              </p>
            </>
          )}
          {week2 && (
            <p className="text-[10px] text-gray-400 dark:text-[#7A6A62] mt-1.5">
              Recorded {new Date(week2.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Week 4 adherence */}
        {week4 ? (
          <div className="mb-4 pt-3 border-t border-gray-100 dark:border-[#3A2820]">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-medium">Week 4 consistency</span>
              <span className="text-[13px] font-bold text-toneek-brown dark:text-[#F0E6DF]">
                {adherenceToDisplay(week4.adherence_score)?.pct ?? '—'}%
              </span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-[#7A6A62] mt-1">
              Recorded {new Date(week4.recorded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        ) : (
          <div className="mb-4 pt-3 border-t border-gray-100 dark:border-[#3A2820]">
             <p className="text-[11px] text-[#8C7B72] dark:text-[#7A6A62] italic mt-1">
               Week 4 adherence recorded at your next check-in.
             </p>
          </div>
        )}
      </div>

      {/* Improvement note */}
      {adh && adh.pct < 70 && (
        <div className="bg-[#FEF3E2] border border-[#D4700A]/30 p-3 rounded-lg mt-2">
          <p className="text-[11px] text-[#C87D3E] font-medium leading-relaxed">
            Consistency below 70% can affect outcome accuracy. Aim for daily application in the next period.
          </p>
        </div>
      )}
    </div>
  )
}
