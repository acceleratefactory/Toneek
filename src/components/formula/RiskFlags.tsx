'use client'

// src/components/formula/RiskFlags.tsx
// Conditionally renders relevant clinical risk flags for this specific customer.
// Shows ONLY flags that apply — never shows all flags to everyone.
//
// Trigger conditions (from toneek_clinical_os_upgrade.md):
//   Melanin Sensitivity  : analysis_scores.melanin_sensitivity > 60 (raw score — higher = more sensitive)
//   Climate Stress       : analysis_scores.climate_stress > 50 (raw score — higher = more stress)
//   Barrier Sensitivity  : analysis_scores.barrier_integrity < 60
//   Medication Interaction: isotretinoin_flag === true
//
// Also shows if risk_score > 0.25 and at least one flag triggers.
// Design: amber left-border card, soft amber background. Informative, not alarming.

interface RiskFlagItem {
  title: string
  body: string
}

interface RiskFlagsProps {
  analysisScores?: {
    melanin_sensitivity?: number
    climate_stress?: number
    barrier_integrity?: number
  }
  isotretinoinFlag?: boolean
  riskScore?: number
  delayMs?: number
}

export default function RiskFlags({
  analysisScores,
  isotretinoinFlag = false,
  riskScore = 0,
  delayMs = 0,
}: RiskFlagsProps) {
  const flags: RiskFlagItem[] = []

  // 1. Melanin Sensitivity (raw > 60 means high sensitivity)
  if ((analysisScores?.melanin_sensitivity ?? 0) > 60) {
    flags.push({
      title: 'High Melanin Sensitivity',
      body: 'Your melanin system reacts strongly to inflammation. Every breakout or irritation event carries a PIH risk. This formula is designed to minimise that risk — but sunscreen is non-negotiable.',
    })
  }

  // 2. Climate Stress (raw > 50 means significant environmental pressure)
  if ((analysisScores?.climate_stress ?? 0) > 50) {
    flags.push({
      title: 'Climate Stress',
      body: 'Your climate creates significant environmental pressure on skin. Humidity and heat increase oil production and reduce active penetration efficiency. Your formula base accounts for this.',
    })
  }

  // 3. Barrier Sensitivity (integrity < 60 means compromised)
  if ((analysisScores?.barrier_integrity ?? 100) < 60) {
    flags.push({
      title: 'Barrier Sensitivity',
      body: 'Your barrier shows signs of disruption. Avoid introducing new actives while on this protocol. Your formula has been calibrated for barrier recovery.',
    })
  }

  // 4. Medication Interaction
  if (isotretinoinFlag) {
    flags.push({
      title: 'Medication Interaction',
      body: 'Your formula has been adjusted to exclude Salicylic Acid due to isotretinoin use. Confirm with your prescribing doctor before beginning any topical treatment.',
    })
  }

  // Only render if risk_score > 0.25 OR at least one specific flag triggered
  const shouldShow = flags.length > 0 && (riskScore > 0.25 || isotretinoinFlag || flags.length > 0)
  if (!shouldShow) return null

  return (
    <section
      className="animate-slide-up opacity-0 flex flex-col gap-3"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans">
        Clinical Context
      </p>

      {flags.map((flag) => (
        <div
          key={flag.title}
          className="border-l-4 border-toneek-amber bg-[#FEF9F3] dark:bg-[#2A1C10] rounded-r-xl px-5 py-4 flex items-start gap-3"
        >
          <span className="text-toneek-amber text-[16px] flex-shrink-0 mt-0.5" aria-hidden="true">
            ⚠
          </span>
          <div>
            <p className="text-[11px] font-bold text-toneek-amber uppercase tracking-widest font-sans mb-1">
              {flag.title}
            </p>
            <p className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-sans leading-snug">
              {flag.body}
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}
