// src/components/formula/AdherencePlaceholder.tsx
// Shows adherence tracking section on /dashboard/formula only.
// State 1 (no outcomes): static placeholder with next check-in date.
// State 2 (outcomes exist): adherence score + amber progress bar + days estimate.
// Per toneek_final_five_upgrades.md — GAP 3.

import type { ClinicalDates } from '@/lib/dates/clinicalDates'
import { formatDate } from '@/lib/dates/clinicalDates'

interface AdherencePlaceholderProps {
  clinical_dates: ClinicalDates
  week2_completed?: boolean
  week4_completed?: boolean  
  week2_outcome?: { adherence_score_at_checkin: number | null, recorded_at: string } | null
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
  week2_completed = false,
  week4_completed = false,
  week2_outcome = null,
  delayMs = 0,
}: AdherencePlaceholderProps) {

  if (!week2_completed) {
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

  // NEW: when week2 IS complete
  if (week2_completed && week2_outcome) {
    const adherence_pct = week2_outcome.adherence_score_at_checkin 
      ? Math.round(week2_outcome.adherence_score_at_checkin * 100)
      : null
      
    return (
      <div
        className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-6 py-5 shadow-sm animate-slide-up opacity-0 flex flex-col justify-between"
        style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
      >
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#8C7B72', fontWeight: 'bold' }}>
          ADHERENCE TRACKING
        </p>
        
        {adherence_pct !== null ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <span style={{ fontSize: '14px', color: '#8C7B72' }}>Week 2 consistency</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#C87D3E' }}>
                {adherence_pct}%
              </span>
            </div>
            <div style={{ 
              height: '4px', background: '#E8E0DA', borderRadius: '2px', 
              marginTop: '8px', overflow: 'hidden' 
            }}>
              <div style={{ 
                height: '100%', width: `${adherence_pct}%`, 
                background: '#C87D3E', borderRadius: '2px' 
              }} />
            </div>
            <p style={{ fontSize: '12px', color: '#8C7B72', marginTop: '8px' }}>
              Recorded {new Date(week2_outcome.recorded_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
            {adherence_pct < 70 && (
              <div style={{ 
                background: '#FEF3E2', borderLeft: '3px solid #C87D3E', 
                padding: '10px 14px', borderRadius: '4px', marginTop: '16px' 
              }}>
                <p style={{ fontSize: '12px', color: '#D4700A', margin: 0 }}>
                  Consistency below 70% can affect outcome accuracy. 
                  Aim for daily application this period.
                </p>
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: '13px', color: '#8C7B72', marginTop: '16px' }}>
            Week 2 check-in recorded. Adherence data not captured this cycle.
          </p>
        )}
        
        {!week4_completed && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E8E0DA' }}>
            <p style={{ fontSize: '12px', color: '#8C7B72', fontStyle: 'italic', margin: 0 }}>
              Week 4 adherence recorded at your next check-in.
            </p>
          </div>
        )}
      </div>
    )
  }

  return null
}
