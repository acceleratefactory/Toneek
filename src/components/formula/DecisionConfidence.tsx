// src/components/formula/DecisionConfidence.tsx
// Displays formula confidence as a tiered label with a 3-segment bar.
// Replaces the flat "Cold Start — Clinical Rules Mode" and percentage bar.
// Tier is derived from confidence_score stored in skin_assessments.
// No percentage shown — honest qualitative assessment only.
// Pure display component — no animation state needed.

interface DecisionConfidenceProps {
  confidenceScore: number   // 0.0 – 1.0 from skin_assessments.confidence_score
  profileCount: number      // count of prediction_log records (passed from page)
  outcomeCount?: number     // count WHERE actual_week8_score IS NOT NULL
  variant?: 'results' | 'dashboard'
  delayMs?: number
}

// ─── Tier derivation ─────────────────────────────────────────────────────────

type ConfidenceTier = 'High' | 'Moderate' | 'Building'

function getTier(score: number): ConfidenceTier {
  if (score >= 0.75) return 'High'
  if (score >= 0.55) return 'Moderate'
  return 'Building'
}

const TIER_TEXT: Record<ConfidenceTier, string> = {
  High:     'This formula matches your profile clearly. The clinical rules for your skin type and climate are well-established.',
  Moderate: 'Your profile has some complexity. This formula follows validated clinical rules with standard confidence.',
  Building: 'Your profile has unusual characteristics. Conservative clinical rules applied. Confidence updates after Week 2 check-in.',
}

const TIER_SEGMENTS: Record<ConfidenceTier, number> = {
  High:     3,
  Moderate: 2,
  Building: 1,
}

// ─── Three-segment bar ───────────────────────────────────────────────────────

function SegmentBar({ filled }: { filled: number }) {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < filled
              ? 'bg-toneek-amber'
              : 'bg-[#E8E0DA] dark:bg-[#3A2820]'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DecisionConfidence({
  confidenceScore,
  profileCount,
  outcomeCount,
  variant = 'results',
  delayMs = 0,
}: DecisionConfidenceProps) {
  const tier     = getTier(confidenceScore)
  const segments = TIER_SEGMENTS[tier]
  const text     = TIER_TEXT[tier]
  // Use outcomeCount if provided (actual_week8_score IS NOT NULL),
  // otherwise fall back to profileCount as a proxy.
  const displayCount = outcomeCount ?? profileCount

  return (
    <div
      className="animate-slide-up opacity-0 bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-6 py-5 shadow-sm"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans">
          Formula Confidence
        </p>
        {/* Tier badge */}
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-sans ${
          tier === 'High'
            ? 'bg-toneek-forest/10 text-toneek-forest'
            : tier === 'Moderate'
            ? 'bg-toneek-amber/10 text-toneek-amber'
            : 'bg-[#E8E0DA] dark:bg-[#3A2820] text-[#8C7B72] dark:text-[#A3938C]'
        }`}>
          {tier}
        </span>
      </div>

      {/* Tier-specific explanation */}
      <p className="text-[12px] text-[#8C7B72] dark:text-[#A3938C] font-sans leading-relaxed mb-4">
        {text}
      </p>

      {/* 3-segment bar */}
      <div className="mb-3">
        <SegmentBar filled={segments} />
      </div>

      {/* Profile count label */}
      <p className="text-[10px] text-[#8C7B72] dark:text-[#7A6A62] font-sans italic">
        Predictive mode unlocks at 200 outcome profiles. Currently: {displayCount} profile{displayCount === 1 ? '' : 's'} collected.
      </p>
    </div>
  )
}
