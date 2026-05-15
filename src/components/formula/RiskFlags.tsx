import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
  id: string
  title: string
  chipLabel: string
  body: string
  severity: 'amber' | 'red'
  alwaysExpanded: boolean
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
  const [expandedFlags, setExpandedFlags] = useState<Record<string, boolean>>({})

  const toggleFlag = (id: string) => {
    setExpandedFlags(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const flags: RiskFlagItem[] = []

  // 1. Melanin Sensitivity (raw > 60 means high sensitivity)
  if ((analysisScores?.melanin_sensitivity ?? 0) > 60) {
    flags.push({
      id: 'melanin',
      title: 'Melanin Sensitivity',
      chipLabel: '☀️ MELANIN SENSITIVITY: High',
      body: 'Your melanin system reacts strongly to inflammation. Every breakout or irritation event carries a PIH risk. This formula is designed to minimise that risk — but sunscreen is non-negotiable.',
      severity: 'amber',
      alwaysExpanded: false,
    })
  }

  // 2. Climate Stress (raw > 50 means significant environmental pressure)
  if ((analysisScores?.climate_stress ?? 0) > 50) {
    flags.push({
      id: 'climate',
      title: 'Climate Stress',
      chipLabel: '🌡️ CLIMATE STRESS: High',
      body: 'Your climate creates significant environmental pressure on skin. Humidity and heat increase oil production and reduce active penetration efficiency. Your formula base accounts for this.',
      severity: 'amber',
      alwaysExpanded: false,
    })
  }

  // 3. Barrier Sensitivity (integrity < 60 means compromised)
  if ((analysisScores?.barrier_integrity ?? 100) < 60) {
    flags.push({
      id: 'barrier',
      title: 'Barrier Sensitivity',
      chipLabel: '🛡️ BARRIER SENSITIVITY',
      body: 'Your barrier shows signs of disruption. Avoid introducing new actives while on this protocol. Your formula has been calibrated for barrier recovery.',
      severity: 'amber',
      alwaysExpanded: false,
    })
  }

  // 4. Medication Interaction
  if (isotretinoinFlag) {
    flags.push({
      id: 'medication',
      title: 'Medication Interaction',
      chipLabel: '💊 MEDICATION ADJUSTED',
      body: 'Your formula has been adjusted to exclude Salicylic Acid due to isotretinoin use. Confirm with your prescribing doctor before beginning any topical treatment.',
      severity: 'red',
      alwaysExpanded: true,
    })
  }

  // Only render if risk_score > 0.25 OR at least one specific flag triggered
  const shouldShow = flags.length > 0 && (riskScore > 0.25 || isotretinoinFlag || flags.length > 0)
  if (!shouldShow) return null

  const renderChip = (flag: RiskFlagItem) => {
    const isExpanded = flag.alwaysExpanded || expandedFlags[flag.id]
    const baseColor = flag.severity === 'red' 
      ? 'bg-[#C13B2E] text-white border-[#C13B2E]' 
      : 'bg-[#F5EFEA] dark:bg-[#3A2820] text-toneek-brown dark:text-[#F0E6DF] border-toneek-amber/30'

    return (
      <button
        key={flag.id}
        onClick={() => !flag.alwaysExpanded && toggleFlag(flag.id)}
        disabled={flag.alwaysExpanded}
        className={`px-3 py-1.5 rounded-md border text-[10px] font-bold tracking-wider flex items-center gap-1.5 transition-colors ${baseColor} ${!flag.alwaysExpanded ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
      >
        <span>{flag.chipLabel}</span>
        {!flag.alwaysExpanded && (
          isExpanded ? <ChevronUp size={14} className="opacity-70" /> : <ChevronDown size={14} className="opacity-70" />
        )}
      </button>
    )
  }

  return (
    <section
      className="animate-slide-up opacity-0 flex flex-col gap-3"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans">
        Clinical Context
      </p>

      {/* Chip Row */}
      <div className="flex flex-wrap gap-2">
        {flags.map(renderChip)}
      </div>

      {/* Expanded Paragraphs */}
      <div className="flex flex-col gap-3 mt-1">
        {flags.filter(f => f.alwaysExpanded || expandedFlags[f.id]).map(flag => {
          const isRed = flag.severity === 'red'
          return (
            <div
              key={`desc-${flag.id}`}
              className={`border-l-4 rounded-r-xl px-5 py-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${isRed ? 'border-[#C13B2E] bg-[#FEF2F2] dark:bg-[#3A1C1C]' : 'border-toneek-amber bg-[#FEF9F3] dark:bg-[#2A1C10]'}`}
            >
              <p className={`text-[11px] font-bold uppercase tracking-widest font-sans ${isRed ? 'text-[#C13B2E]' : 'text-toneek-amber'}`}>
                {flag.title}
              </p>
              <p className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-sans leading-snug">
                {flag.body}
              </p>
              
              {!flag.alwaysExpanded && (
                <button 
                  onClick={() => toggleFlag(flag.id)}
                  className={`text-[11px] font-semibold underline self-end mt-1 ${isRed ? 'text-[#C13B2E]' : 'text-[#8C7B72] hover:text-[#d4a574]'}`}
                >
                  Close
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
