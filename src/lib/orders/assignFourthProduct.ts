// src/lib/orders/assignFourthProduct.ts

export type FourthProductSKU = 
  | 'TNK-SPF-30'           // Toneek Mineral SPF 50
  | 'TNK-TON-BRT'          // Toneek Brightening Toner
  | 'TNK-TON-HYD'          // Toneek Hydrating Toner

export interface FourthProductAssignment {
  sku: FourthProductSKU
  display_name: string
  rationale: string
}

export function assignFourthProduct(assessment: {
  primary_concern: string
  skin_type: string
  climate_zone: string
  barrier_integrity: number          // from analysis_scores
  analysis_scores: Record<string, number>
  formula_tier: string
  medications?: string[]
  pregnant_or_breastfeeding?: boolean
}): FourthProductAssignment {

  const {
    primary_concern,
    skin_type,
    climate_zone,
    barrier_integrity,
    formula_tier,
    pregnant_or_breastfeeding,
  } = assessment

  // ── RULE 1: Restoration Protocol → always Hydrating Toner ──────────
  // Barrier is compromised. SPF can wait. Hydration first.
  if (formula_tier === 'restoration' || assessment.formula_tier?.startsWith('RP-')) {
    return {
      sku: 'TNK-TON-HYD',
      display_name: 'Toneek Hydrating Toner',
      rationale: 'Your barrier is in repair mode. Extra hydration supports the restoration protocol.',
    }
  }

  // ── RULE 2: Pregnancy → always SPF ─────────────────────────────────
  // Pregnant customers: SPF is the only safe fourth product.
  // No retinol-adjacent boosters, no actives beyond what is in PG formula.
  if (pregnant_or_breastfeeding) {
    return {
      sku: 'TNK-SPF-30',
      display_name: 'Toneek Mineral SPF 50',
      rationale: 'Safe for pregnancy. UV protection prevents hormonal pigmentation from worsening.',
    }
  }

  // ── RULE 3: Humid tropical or equatorial + PIH or tone ─────────────
  // High UV environment + pigmentation primary concern = SPF is the
  // most clinically impactful fourth product.
  if (
    ['humid_tropical', 'equatorial', 'semi_arid'].includes(climate_zone) &&
    ['PIH', 'tone'].includes(primary_concern)
  ) {
    return {
      sku: 'TNK-SPF-30',
      display_name: 'Toneek Mineral SPF 50',
      rationale: 'UV is the primary PIH trigger in your climate. SPF is the most impactful addition to your protocol.',
    }
  }

  // ── RULE 4: Dry or dehydrated skin in cold or temperate climate ─────
  // Hydration deficit + climate stress = Hydrating Toner.
  if (
    (skin_type === 'dry' || barrier_integrity < 65) &&
    ['cold_continental', 'temperate_maritime'].includes(climate_zone)
  ) {
    return {
      sku: 'TNK-TON-HYD',
      display_name: 'Toneek Hydrating Toner',
      rationale: 'Cold climate strips moisture. A hydrating toner compensates for the dehydration your climate causes.',
    }
  }

  // ── RULE 5: PIH or tone as primary concern in any remaining climate ─
  // If SPF was not assigned above, Brightening Toner prepares the skin
  // surface for maximum active penetration.
  if (['PIH', 'tone'].includes(primary_concern)) {
    return {
      sku: 'TNK-TON-BRT',
      display_name: 'Toneek Brightening Toner',
      rationale: 'Prepares skin surface for maximum Niacinamide and brightening active absorption.',
    }
  }

  // ── RULE 6: Acne or oiliness primary ────────────────────────────────
  // SPF is the right fourth product — no additional actives needed
  // beyond the formula. SPF prevents post-acne PIH from UV.
  if (['acne', 'oiliness'].includes(primary_concern)) {
    return {
      sku: 'TNK-SPF-30',
      display_name: 'Toneek Mineral SPF 50',
      rationale: 'Mineral SPF prevents post-acne marks from darkening. Lightweight mineral formula does not clog pores.',
    }
  }

  // ── DEFAULT: SPF for all other profiles ─────────────────────────────
  return {
    sku: 'TNK-SPF-30',
    display_name: 'Toneek Mineral SPF 50',
    rationale: 'UV protection is the most universally impactful addition to any active skincare protocol.',
  }
}
