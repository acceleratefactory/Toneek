// src/components/formula/RealOutcomes.tsx
// Shows real outcome data when formula_performance records exist.
// State 1 (null data): awaiting beta cohort placeholder with empty amber circle.
// State 2 (data exists): filled amber circle + actual stats.
// Positioned below SystemLearningDisclosure, above CTA on /results.
// Per toneek_final_polish.md — Phase 4.

interface FormulaPerformanceData {
  success_rate: number            // 0.0–1.0
  avg_improvement_score: number   // e.g. 8.4
  total_customers: number         // e.g. 24
}

interface RealOutcomesProps {
  performanceData?: FormulaPerformanceData | null
  delayMs?: number
}

export default function RealOutcomes({
  performanceData,
  delayMs = 0,
}: RealOutcomesProps) {
  return (
    <div
      className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-6 py-5 shadow-sm animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Title */}
      <p className="text-[11px] font-bold text-[#8C7B72] dark:text-[#A3938C] uppercase tracking-widest font-sans mb-4">
        Real Outcomes
      </p>

      {performanceData ? (
        // State 2 — live performance data exists
        <div className="flex items-start gap-3">
          {/* Filled amber circle */}
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-toneek-amber flex items-center justify-center mt-0.5">
            <span className="text-white text-[9px] font-bold">✓</span>
          </div>
          <p className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-sans leading-relaxed">
            <span className="font-semibold text-toneek-brown dark:text-[#F0E6DF]">
              {performanceData.total_customers}
            </span>{' '}
            customers on this formula.{' '}
            <span className="font-semibold text-toneek-brown dark:text-[#F0E6DF]">
              {Math.round(performanceData.success_rate * 100)}%
            </span>{' '}
            saw measurable improvement by Week 8. Average improvement:{' '}
            <span className="font-semibold text-toneek-brown dark:text-[#F0E6DF]">
              +{performanceData.avg_improvement_score.toFixed(1)} points.
            </span>
          </p>
        </div>
      ) : (
        // State 1 — awaiting beta cohort data
        <div className="flex items-start gap-3">
          {/* Empty amber-border circle */}
          <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-toneek-amber bg-transparent mt-0.5" />
          <div>
            <p className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-sans leading-relaxed mb-3">
              Awaiting first Week 8 check-ins from beta cohort
              — estimated availability: June 2026
            </p>
            <p className="text-[11px] italic text-[#8C7B72] dark:text-[#6A5A52] font-sans leading-relaxed">
              When complete: Toneek-specific outcome data will replace clinical
              literature estimates throughout this page.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
