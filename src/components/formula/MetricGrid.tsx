'use client'

import React from 'react'
import AnimatedScoreRing from './AnimatedScoreRing'
import {
  getPigmentationLabel,
  getBarrierLabel,
  getOilBalanceLabel,
  getInflammationLabel,
  getHydrationLabel,
  getMelaninLabel,
  getTreatmentToleranceLabel,
  getClimateStressLabel,
} from '@/lib/analysis/calculateSkinScores'

interface MetricGridProps {
  assessment: any // Pass the raw skin_assessments row
  delayMs?: number
  // Percentile comparisons per metric key (0–100). null = cold start.
  comparativeData?: Record<string, number> | null
}

export default function MetricGrid({ assessment, delayMs = 0, comparativeData }: MetricGridProps) {
  const stored = assessment?.analysis_scores

  // ─── Read from stored analysis_scores if available (set after Phase 3 was live) ───
  // Otherwise fall back to inline legacy calculation for older assessments.

  // 1. BARRIER INTEGRITY
  let barrierScore: number
  if (stored?.barrier_integrity != null) {
    barrierScore = stored.barrier_integrity
  } else {
    // Legacy fallback
    let b = 100
    if (assessment?.bleaching_history === 'active') b -= 45
    else if (assessment?.bleaching_history === 'recent_12mo') b -= 30
    else if (assessment?.bleaching_history === 'historical') b -= 10
    if ((assessment?.bleaching_cessation_effects || []).includes('barrier_sensitive')) b -= 15
    if ((assessment?.triggers || []).includes('products_trigger')) b -= 12
    if (assessment?.current_product_count === '6_or_more') b -= 15
    if ((assessment?.medications || []).includes('corticosteroids')) b -= 20
    if ((assessment?.medications || []).includes('isotretinoin')) b -= 25
    barrierScore = Math.min(100, Math.max(10, Math.round(b)))
  }
  const barrierLabel = getBarrierLabel(barrierScore)

  // 2. TREATMENT TOLERANCE
  let toleranceScore: number
  if (stored?.treatment_tolerance != null) {
    toleranceScore = stored.treatment_tolerance
  } else {
    let t = 100
    if (barrierScore < 40) t -= 30
    else if (barrierScore < 60) t -= 15
    else if (barrierScore < 80) t -= 5
    if (assessment?.primary_concern === 'sensitivity') t -= 25
    if ((assessment?.triggers || []).includes('products_trigger')) t -= 15
    if ((assessment?.medications || []).includes('isotretinoin')) t -= 40
    if ((assessment?.medications || []).includes('corticosteroids')) t -= 20
    if (assessment?.pregnant_or_breastfeeding === true) t -= 30
    toleranceScore = Math.min(100, Math.max(15, Math.round(t)))
  }
  const toleranceLabel = getTreatmentToleranceLabel(toleranceScore)

  // 3. CLIMATE STRESS (raw score — higher = worse, displayed inverted)
  let climateStressRaw: number
  if (stored?.climate_stress != null) {
    climateStressRaw = stored.climate_stress
  } else {
    let c = 20
    const zone = assessment?.climate_zone || ''
    if (zone === 'humid_tropical') c += 35
    else if (zone === 'equatorial') c += 45
    else if (zone === 'semi_arid') c += 30
    else if (zone === 'cold_continental') c += 30
    else if (zone === 'temperate_maritime') c += 15
    else if (zone === 'mediterranean') c += 20
    if (assessment?.years_in_current_location === 'less_than_1') c += 20
    c += 10 * (assessment?.climate_transition_effects || []).length
    if (zone === 'humid_tropical' || zone === 'semi_arid') c += 10
    climateStressRaw = Math.min(100, Math.max(10, Math.round(c)))
  }
  const climateLabel = getClimateStressLabel(climateStressRaw)
  // Inverted for ring: lower stress raw = more ring filled (ring shows "climate resilience")
  const climateDisplayScore = 100 - climateStressRaw

  // 4. MELANIN SENSITIVITY (raw score — higher = more sensitive, displayed inverted)
  let melaninRaw: number
  if (stored?.melanin_sensitivity != null) {
    melaninRaw = stored.melanin_sensitivity
  } else {
    let m = 50
    if (assessment?.fitzpatrick_estimate === 'VI') m += 20
    else if (assessment?.fitzpatrick_estimate === 'V') m += 10
    if (assessment?.bleaching_history === 'active') m += 25
    else if (assessment?.bleaching_history === 'recent_12mo') m += 15
    if ((assessment?.bleaching_cessation_effects || []).includes('rebound_darkening')) m += 15
    if (assessment?.pregnant_or_breastfeeding === true) m += 15
    melaninRaw = Math.min(100, Math.max(20, Math.round(m)))
  }
  const melaninLabel = getMelaninLabel(melaninRaw)
  // Inverted for ring: lower sensitivity = more ring filled (ring shows "melanin stability")
  const melaninDisplayScore = 100 - melaninRaw

  // 5. PIGMENTATION LOAD
  let pigmentationScore: number
  if (stored?.pigmentation_load != null) {
    pigmentationScore = stored.pigmentation_load
  } else {
    let p = 100
    if (assessment?.concern_duration === 'more_than_1_year') p -= 30
    else if (assessment?.concern_duration === '6_to_12_months') p -= 20
    else if (assessment?.concern_duration === '1_to_6_months') p -= 10
    if (assessment?.concern_trajectory === 'getting_worse') p -= 15
    else if (assessment?.concern_trajectory === 'improving') p += 10
    if (assessment?.primary_concern === 'PIH') p -= 20
    else if (assessment?.primary_concern === 'tone') p -= 12
    if (assessment?.bleaching_history === 'active') p -= 25
    else if (assessment?.bleaching_history === 'recent_12mo') p -= 15
    else if (assessment?.bleaching_history === 'historical') p -= 5
    pigmentationScore = Math.min(100, Math.max(15, Math.round(p)))
  }
  const pigmentationLabel = getPigmentationLabel(pigmentationScore)

  // 6. OIL BALANCE
  let oilScore: number
  if (stored?.oil_balance != null) {
    oilScore = stored.oil_balance
  } else {
    let o = 70
    if (assessment?.skin_type === 'oily') o = 35
    else if (assessment?.skin_type === 'combination') o = 55
    else if (assessment?.skin_type === 'normal') o = 75
    else if (assessment?.skin_type === 'dry') o = 85
    else if (assessment?.skin_type === 'variable') o = 50
    if (assessment?.climate_zone === 'humid_tropical') o -= 10
    if (assessment?.climate_zone === 'equatorial') o -= 15
    if (assessment?.primary_concern === 'oiliness') o -= 15
    oilScore = Math.min(100, Math.max(15, Math.round(o)))
  }
  const oilLabel = getOilBalanceLabel(oilScore)

  // 7. INFLAMMATION LEVEL
  let inflammationScore: number
  if (stored?.inflammation_level != null) {
    inflammationScore = stored.inflammation_level
  } else {
    let i = 80
    if (assessment?.primary_concern === 'acne') i -= 25
    if ((assessment?.secondary_concerns || []).includes('acne')) i -= 12
    if (assessment?.primary_concern === 'sensitivity') i -= 20
    if (assessment?.bleaching_history === 'active') i -= 20
    inflammationScore = Math.min(100, Math.max(10, Math.round(i)))
  }
  const inflammationLabel = getInflammationLabel(inflammationScore)

  // 8. HYDRATION STATUS
  let hydrationScore: number
  if (stored?.hydration_status != null) {
    hydrationScore = stored.hydration_status
  } else {
    let h = 75
    if (assessment?.skin_type === 'dry') h = 35
    else if (assessment?.skin_type === 'combination') h = 60
    else if (assessment?.skin_type === 'normal') h = 75
    else if (assessment?.skin_type === 'oily') h = 65
    if (assessment?.climate_zone === 'cold_continental') h -= 20
    if (assessment?.climate_zone === 'semi_arid') h -= 15
    if (assessment?.climate_zone === 'humid_tropical') h += 10
    if (assessment?.primary_concern === 'dryness') h = Math.min(h, 40)
    hydrationScore = Math.min(100, Math.max(15, Math.round(h)))
  }
  const hydrationLabel = getHydrationLabel(hydrationScore)

  // ─── Define the 8 metrics in the required 2-row order ───
  const row1 = [
    {
      title: 'BARRIER INTEGRITY',
      score: barrierScore,
      displayScore: barrierScore,
      label: barrierLabel.label,
      description: barrierLabel.description,
    },
    {
      title: 'TREATMENT TOLERANCE',
      score: toleranceScore,
      displayScore: toleranceScore,
      label: toleranceLabel.label,
      description: toleranceLabel.description,
    },
    {
      title: 'CLIMATE STRESS',
      score: climateStressRaw,
      displayScore: climateDisplayScore,
      label: climateLabel.label,
      description: climateLabel.description,
    },
    {
      title: 'MELANIN SENSITIVITY',
      score: melaninRaw,
      displayScore: melaninDisplayScore,
      label: melaninLabel.label,
      description: melaninLabel.description,
    },
  ]

  const row2 = [
    {
      title: 'PIGMENTATION LOAD',
      score: pigmentationScore,
      displayScore: pigmentationScore,
      label: pigmentationLabel.label,
      description: pigmentationLabel.description,
    },
    {
      title: 'OIL BALANCE',
      score: oilScore,
      displayScore: oilScore,
      label: oilLabel.label,
      description: oilLabel.description,
    },
    {
      title: 'INFLAMMATION LEVEL',
      score: inflammationScore,
      displayScore: inflammationScore,
      label: inflammationLabel.label,
      description: inflammationLabel.description,
    },
    {
      title: 'HYDRATION STATUS',
      score: hydrationScore,
      displayScore: hydrationScore,
      label: hydrationLabel.label,
      description: hydrationLabel.description,
    },
  ]

  const allMetrics = [...row1, ...row2]

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {allMetrics.map((metric, i) => (
        <div
          key={metric.title}
          className="bg-white dark:bg-[#261B18] border border-gray-100 dark:border-[#3A2820] shadow-sm rounded-xl p-4 flex flex-col items-center gap-3 hover:border-toneek-amber/30 transition-colors text-center"
        >
          <AnimatedScoreRing
            score={metric.displayScore}
            size={56}
            strokeWidth={5}
            showLabel={false}
            delay={delayMs + (i * 80)}
          />
          <div className="flex flex-col gap-0.5">
            <h5 className="text-[10px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans leading-tight">
              {metric.title}
            </h5>
            <p className="text-[13px] font-semibold text-toneek-brown dark:text-[#F0E6DF] font-sans">
              {metric.label}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-[#7A6A62] font-sans leading-snug mt-0.5">
              {metric.description}
            </p>

            {/* Comparative Insight — 10px italic warm grey per spec */}
            <p className="text-[10px] italic text-[#8C7B72] dark:text-[#6A5A52] font-sans mt-1">
              {comparativeData === null || comparativeData === undefined
                ? 'Benchmark updating — check back after your Week 2 check-in'
                : comparativeData[metric.title] !== undefined
                  ? `${comparativeData[metric.title] >= 50 ? 'Better' : 'Lower'} than ${comparativeData[metric.title]}% of similar profiles`
                  : 'Benchmark updating — check back after your Week 2 check-in'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
