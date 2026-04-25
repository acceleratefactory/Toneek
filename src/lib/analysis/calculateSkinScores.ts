// src/lib/analysis/calculateSkinScores.ts
// Calculates all 8 clinical skin analysis scores from assessment data.
// Called in: api/assessments/submit (on creation) and api/checkin/submit (on each check-in).
// DO NOT call any external APIs here. Pure deterministic logic only.

export interface SkinAnalysisScores {
  pigmentation_load: number
  barrier_integrity: number
  oil_balance: number
  inflammation_level: number
  hydration_status: number
  melanin_sensitivity: number
  treatment_tolerance: number
  climate_stress: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

// ─── Score 1: PIGMENTATION LOAD ───────────────────────────────────────────────
// Higher = better (less pigmentation burden)
function calculatePigmentationLoad(a: any): number {
  let base = 100

  // Duration penalty
  if (a.concern_duration === 'more_than_1_year') base -= 30
  else if (a.concern_duration === '6_to_12_months') base -= 20
  else if (a.concern_duration === '1_to_6_months') base -= 10

  // Trajectory
  if (a.concern_trajectory === 'getting_worse') base -= 15
  else if (a.concern_trajectory === 'improving') base += 10

  // Primary concern
  if (a.primary_concern === 'PIH') base -= 20
  else if (a.primary_concern === 'tone') base -= 12

  // Bleaching history worsens PIH outlook
  if (a.bleaching_history === 'active') base -= 25
  else if (a.bleaching_history === 'recent_12mo') base -= 15
  else if (a.bleaching_history === 'historical') base -= 5

  // Hormonal PIH is harder to treat
  const hormonal_trigger =
    (a.triggers || []).includes('hormonal_trigger') ||
    a.hormonal_contraception === true
  if (hormonal_trigger && a.primary_concern === 'PIH') base -= 10

  return clamp(base, 15, 100)
}

// ─── Score 2: BARRIER INTEGRITY ───────────────────────────────────────────────
// Higher = better (stronger barrier)
function calculateBarrierIntegrity(a: any): number {
  let base = 100

  // Bleaching history is the primary barrier destroyer
  if (a.bleaching_history === 'active') base -= 45
  else if (a.bleaching_history === 'recent_12mo') base -= 30
  else if (a.bleaching_history === 'historical') base -= 10

  // Specific cessation effects
  const cessation = a.bleaching_cessation_effects || []
  if (cessation.includes('barrier_sensitive')) base -= 15
  if (cessation.includes('rebound_darkening')) base -= 5

  // Product overload damages barrier
  if (a.current_product_count === '6_or_more') base -= 15
  if ((a.current_actives || []).includes('retinoid')) base -= 8
  if (
    (a.current_actives || []).includes('exfoliant') &&
    a.current_product_count === '6_or_more'
  ) base -= 10

  // Products as trigger = already compromised
  if ((a.triggers || []).includes('products_trigger')) base -= 12

  // Medications that thin barrier
  if ((a.medications || []).includes('corticosteroids')) base -= 20
  if ((a.medications || []).includes('isotretinoin')) base -= 25

  return clamp(base, 10, 100)
}

// ─── Score 3: OIL BALANCE ─────────────────────────────────────────────────────
// Higher = better (more balanced sebum)
function calculateOilBalance(a: any): number {
  let base = 70

  // Skin type sets the baseline
  if (a.skin_type === 'oily') base = 35
  else if (a.skin_type === 'combination') base = 55
  else if (a.skin_type === 'normal') base = 75
  else if (a.skin_type === 'dry') base = 85
  else if (a.skin_type === 'variable') base = 50

  // Climate amplifies oiliness
  if (a.climate_zone === 'humid_tropical') base -= 10
  if (a.climate_zone === 'equatorial') base -= 15
  if (a.climate_zone === 'cold_continental' && a.skin_type === 'oily') base += 5

  // Acne indicates active oiliness
  if (
    a.primary_concern === 'acne' ||
    (a.secondary_concerns || []).includes('acne')
  ) base -= 10
  if (a.primary_concern === 'oiliness') base -= 15

  // Hormonal cycle drives sebum
  const hormonal_trigger =
    (a.triggers || []).includes('hormonal_trigger') ||
    a.hormonal_contraception === true
  if (hormonal_trigger) base -= 8

  return clamp(base, 15, 100)
}

// ─── Score 4: INFLAMMATION LEVEL ──────────────────────────────────────────────
// Higher = better (less inflammation)
function calculateInflammationLevel(a: any): number {
  let base = 80

  // Acne = active inflammation
  if (a.primary_concern === 'acne') base -= 25
  if ((a.secondary_concerns || []).includes('acne')) base -= 12

  // Active breakouts + PIH = double inflammation signal
  if (
    a.primary_concern === 'acne' &&
    (a.secondary_concerns || []).includes('PIH')
  ) base -= 10

  // Sensitivity = chronic low-level inflammation
  if (a.primary_concern === 'sensitivity') base -= 20
  if ((a.triggers || []).includes('stress_trigger')) base -= 8
  if ((a.triggers || []).includes('hormonal_trigger')) base -= 10

  // Active bleaching causes significant inflammation
  if (a.bleaching_history === 'active') base -= 20
  if ((a.bleaching_cessation_effects || []).includes('barrier_sensitive')) base -= 10

  // High product load = irritation inflammation
  if (
    a.current_product_count === '6_or_more' &&
    (a.triggers || []).includes('products_trigger')
  ) base -= 15

  return clamp(base, 10, 100)
}

// ─── Score 5: HYDRATION STATUS ────────────────────────────────────────────────
// Higher = better (more hydrated)
function calculateHydrationStatus(a: any): number {
  let base = 75

  // Skin type
  if (a.skin_type === 'dry') base = 35
  else if (a.skin_type === 'combination') base = 60
  else if (a.skin_type === 'normal') base = 75
  else if (a.skin_type === 'oily') base = 65
  else if (a.skin_type === 'variable') base = 55

  // Climate dramatically affects hydration
  if (a.climate_zone === 'cold_continental') base -= 20
  if (a.climate_zone === 'temperate_maritime') base -= 10
  if (a.climate_zone === 'semi_arid') base -= 15
  if (a.climate_zone === 'humid_tropical') base += 10

  // Climate transition means skin hasn't adapted
  if (a.years_in_current_location === 'less_than_1') base -= 15
  if ((a.climate_transition_effects || []).includes('more_dry')) base -= 20

  // Primary dryness concern caps the score
  if (a.primary_concern === 'dryness') base = Math.min(base, 40)

  return clamp(base, 15, 100)
}

// ─── Score 6: MELANIN SENSITIVITY ────────────────────────────────────────────
// INVERTED: Higher raw score = MORE sensitive (worse)
// Display as: 100 - raw for ring fill
function calculateMelaninSensitivity(a: any): number {
  let base = 50

  // Fitzpatrick (deeper = more reactive melanin)
  if (a.fitzpatrick_estimate === 'VI') base += 20
  else if (a.fitzpatrick_estimate === 'V') base += 10
  // IV adds 0

  // PIH duration — chronic = highly reactive melanocytes
  if (a.concern_duration === 'more_than_1_year' && a.primary_concern === 'PIH') base += 20
  else if (a.concern_duration === '6_to_12_months' && a.primary_concern === 'PIH') base += 10

  // Bleaching history = disrupted melanocyte regulation
  if (a.bleaching_history === 'active') base += 25
  else if (a.bleaching_history === 'recent_12mo') base += 15
  if ((a.bleaching_cessation_effects || []).includes('rebound_darkening')) base += 15

  // Hormonal triggers drive melanin production
  const hormonal_trigger =
    (a.triggers || []).includes('hormonal_trigger') ||
    a.hormonal_contraception === true
  if (hormonal_trigger) base += 10
  if (a.pregnant_or_breastfeeding === true) base += 15

  return clamp(base, 20, 100)
}

// ─── Score 7: TREATMENT TOLERANCE ─────────────────────────────────────────────
// Higher = better (can handle more active ingredients)
function calculateTreatmentTolerance(a: any, barrierScore: number): number {
  let base = 100

  // Barrier damage reduces tolerance
  if (barrierScore < 40) base -= 30
  else if (barrierScore < 60) base -= 15
  else if (barrierScore < 80) base -= 5

  // Sensitivity reduces tolerance
  if (a.primary_concern === 'sensitivity') base -= 25
  if ((a.triggers || []).includes('products_trigger')) base -= 15
  if (
    (a.current_actives || []).includes('retinoid') &&
    a.current_product_count === '6_or_more'
  ) base -= 10

  // Medications reduce tolerance
  if ((a.medications || []).includes('isotretinoin')) base -= 40
  if ((a.medications || []).includes('corticosteroids')) base -= 20

  // Pregnancy restricts active options
  if (a.pregnant_or_breastfeeding === true) base -= 30

  // Climate modifier
  if (a.climate_zone === 'cold_continental' && a.skin_type === 'oily') base -= 5

  return clamp(base, 15, 100)
}

// ─── Score 8: CLIMATE STRESS INDEX ───────────────────────────────────────────
// INVERTED: Higher raw score = MORE stress (worse)
// Display as: 100 - raw for ring fill
function calculateClimateStress(a: any): number {
  let base = 20

  // Climate zones and their stress contribution
  if (a.climate_zone === 'humid_tropical') base += 35
  else if (a.climate_zone === 'equatorial') base += 45
  else if (a.climate_zone === 'semi_arid') base += 30
  else if (a.climate_zone === 'cold_continental') base += 30
  else if (a.climate_zone === 'temperate_maritime') base += 15
  else if (a.climate_zone === 'mediterranean') base += 20

  // Climate transition amplifies stress
  if (a.years_in_current_location === 'less_than_1') base += 20
  const transitionCount = (a.climate_transition_effects || []).length
  base += 10 * transitionCount

  // High UV exposure amplifies pigmentation stress
  if (
    a.climate_zone === 'humid_tropical' ||
    a.climate_zone === 'semi_arid'
  ) base += 10

  return clamp(base, 10, 100)
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
// Call this in assessment submit AND check-in completion.
export function calculateSkinScores(assessment: any): SkinAnalysisScores {
  // Barrier is calculated first because Treatment Tolerance depends on it
  const barrier_integrity = calculateBarrierIntegrity(assessment)

  return {
    pigmentation_load:    calculatePigmentationLoad(assessment),
    barrier_integrity,
    oil_balance:          calculateOilBalance(assessment),
    inflammation_level:   calculateInflammationLevel(assessment),
    hydration_status:     calculateHydrationStatus(assessment),
    melanin_sensitivity:  calculateMelaninSensitivity(assessment),
    treatment_tolerance:  calculateTreatmentTolerance(assessment, barrier_integrity),
    climate_stress:       calculateClimateStress(assessment),
  }
}

// ─── DISPLAY HELPERS ──────────────────────────────────────────────────────────
// Use these in MetricGrid to get the human-readable label for each score.

export function getPigmentationLabel(score: number) {
  if (score >= 80) return { label: 'Minimal', description: 'Little to no active pigmentation' }
  if (score >= 60) return { label: 'Moderate', description: 'Visible marks, responding to treatment' }
  if (score >= 40) return { label: 'Active', description: 'Significant pigmentation requiring targeted treatment' }
  return { label: 'Intensive', description: 'Complex pigmentation — multi-pathway approach needed' }
}

export function getBarrierLabel(score: number) {
  if (score >= 80) return { label: 'Strong', description: 'Barrier intact and functioning well' }
  if (score >= 60) return { label: 'Moderate', description: 'Minor barrier disruption — manageable' }
  if (score >= 40) return { label: 'Compromised', description: 'Barrier needs repair before active treatment' }
  return { label: 'Damaged', description: 'Significant barrier damage — restoration protocol required' }
}

export function getOilBalanceLabel(score: number) {
  if (score >= 80) return { label: 'Balanced', description: 'Well-regulated sebum production' }
  if (score >= 60) return { label: 'Mild Excess', description: 'Mild excess sebum' }
  if (score >= 40) return { label: 'Active', description: 'Elevated sebum — treatment focus needed' }
  return { label: 'Overactive', description: 'Significant sebum excess — primary treatment target' }
}

export function getInflammationLabel(score: number) {
  if (score >= 80) return { label: 'Calm', description: 'No significant inflammatory signals' }
  if (score >= 60) return { label: 'Mild', description: 'Low-level inflammation present' }
  if (score >= 40) return { label: 'Moderate', description: 'Active inflammation — anti-inflammatory actives prioritised' }
  return { label: 'Elevated', description: 'High inflammation load — formula targets this as primary concern' }
}

export function getHydrationLabel(score: number) {
  if (score >= 80) return { label: 'Well Hydrated', description: 'Skin moisture levels are healthy' }
  if (score >= 60) return { label: 'Adequate', description: 'Mild dehydration — preventative hydration recommended' }
  if (score >= 40) return { label: 'Dehydrated', description: 'Significant moisture deficit — hydration is a treatment priority' }
  return { label: 'Severely Dry', description: 'Critical moisture deficit — barrier repair and hydration first' }
}

// Melanin Sensitivity: INVERTED — raw score is "how reactive", displayed inversely
export function getMelaninLabel(rawScore: number) {
  if (rawScore <= 40) return { label: 'Low', description: 'Melanin system well-regulated' }
  if (rawScore <= 60) return { label: 'Moderate', description: 'Melanin responds to inflammation — PIH prevention important' }
  if (rawScore <= 80) return { label: 'High', description: 'Reactive melanin — PIH is a primary risk factor' }
  return { label: 'Very High', description: 'Highly reactive — every formula decision considers PIH risk' }
}

export function getTreatmentToleranceLabel(score: number) {
  if (score >= 80) return { label: 'High', description: 'Can handle full clinical concentration actives' }
  if (score >= 60) return { label: 'Good', description: 'Standard formula concentrations appropriate' }
  if (score >= 40) return { label: 'Moderate', description: 'Reduced concentrations recommended — gradual introduction' }
  return { label: 'Low', description: 'Barrier-first approach required before active treatment' }
}

// Climate Stress: INVERTED — raw score is "how stressed", displayed inversely
export function getClimateStressLabel(rawScore: number) {
  if (rawScore <= 30) return { label: 'Low', description: 'Climate is manageable for your skin' }
  if (rawScore <= 50) return { label: 'Moderate', description: 'Environmental factors require formula compensation' }
  if (rawScore <= 70) return { label: 'High', description: 'Significant climate stress — formula adapted to your environment' }
  return { label: 'Intense', description: 'Extreme climate conditions — formula heavily optimised for environment' }
}
