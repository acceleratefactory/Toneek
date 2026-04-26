// src/lib/formula/generateFormulaLogic.ts
// Generates 3–4 specific reasoning paragraphs explaining WHY this formula
// was assigned to this specific customer. Not generic — specific to the
// intersection of their climate, skin type, primary concern, and formula tier.
// Pure function — no database calls, no side effects.

export interface FormulaLogicParagraph {
  arrow: string  // the "→" prefix text
  body: string   // the explanation body
}

interface AssessmentData {
  climate_zone?: string
  skin_type?: string
  primary_concern?: string
  formula_tier?: string
  city?: string
}

// ─── Climate zone plain-language descriptions ─────────────────────────────────

const CLIMATE_BASES: Record<string, string> = {
  humid_tropical:     'humid tropical climate — lightweight gel base formulated to survive 85%+ humidity without occluding pores',
  equatorial:         'equatorial climate — ultra-lightweight, sweat-resistant base calibrated for extreme heat and year-round humidity',
  semi_arid:          'hot dry climate — extended moisture-retention base with barrier support to prevent transepidermal water loss',
  temperate_maritime: 'mild damp climate — balanced hydration base with cold-heating protection for indoor air conditions',
  cold_continental:   'cold continental climate — barrier-first formulation with cold-weather actives and reinforced occlusion',
  mediterranean:      'mediterranean climate — dual-season base adjusted for dry summer heat and mild wet winter conditions',
}

const CLIMATE_CONTEXT: Record<string, string> = {
  humid_tropical:     'Hot and humid environments raise sebum production, reduce active ingredient penetration, and create a distinct moisture-imbalance pattern that standard formulas do not account for.',
  equatorial:         'Equatorial conditions put continuous pressure on the skin barrier — high heat, humidity, and UV exposure year-round require an ultra-lightweight approach that does not trap heat.',
  semi_arid:          'Hot and dry climates strip moisture from the skin surface faster than temperate environments. Your formula prioritises transepidermal water loss prevention alongside active delivery.',
  temperate_maritime: 'Mild but damp climates combined with indoor central heating create a specific barrier challenge — your formula balances outdoor humidity with indoor dehydration.',
  cold_continental:   'Cold winters cause barrier contraction and increased sensitivity. Your formula leads with barrier recovery before addressing cosmetic concerns.',
  mediterranean:      'Mediterranean skin faces dry summer UV stress followed by wet mild winters — seasonal adjustment is built into your formula base.',
}

// ─── Primary concern active priority ────────────────────────────────────────

const CONCERN_ACTIVES: Record<string, string> = {
  PIH:         'Tranexamic Acid and Niacinamide as primary actives — anti-inflammatory brighteners that reduce post-inflammatory hyperpigmentation without triggering further melanin activation',
  tone:        'Niacinamide and Azelaic Acid as primary actives — evening uneven tone without photosensitising the skin',
  acne:        'Niacinamide and Salicylic Acid as primary actives — regulating sebum and clearing congested pores while managing post-acne PIH risk',
  dryness:     'Centella Asiatica for barrier repair as the primary active — not aggressive brightening agents, which would disrupt an already compromised barrier',
  sensitivity: 'Centella Asiatica and Bakuchiol as primary actives — barrier-calming and gentle retinol-alternative without the risk of reactive flares',
  oiliness:    'Salicylic Acid and Niacinamide as primary actives — exfoliating within the pore and regulating sebum at the surface level simultaneously',
}

// ─── Formula tier context ────────────────────────────────────────────────────

const TIER_CONTEXT: Record<string, string> = {
  conservative:   'Conservative — active concentrations are calibrated below clinical maximums. This reduces initial reactivity and allows your barrier to adapt before concentrations are increased.',
  standard:       'Standard — active concentrations are calibrated at mid-range clinical levels. Your skin profile supports effective dosing without heightened reactivity risk.',
  accelerated:    'Accelerated — active concentrations are calibrated at upper clinical levels. Your skin profile shows high treatment tolerance. Results are expected faster.',
  restoration:    'Restoration — your formula leads with barrier recovery before cosmetic actives. Concentrations are conservative until your Week 2 check-in confirms barrier stabilisation.',
}

// ─── Main function ───────────────────────────────────────────────────────────

export function generateFormulaLogic(assessment: AssessmentData): FormulaLogicParagraph[] {
  const climateZone    = (assessment.climate_zone    || '').toLowerCase().trim()
  const skinType       = (assessment.skin_type       || 'unknown').toLowerCase().trim()
  const primaryConcern = (assessment.primary_concern || '').toLowerCase().trim()
  const formulaTier    = (assessment.formula_tier    || '').toLowerCase().trim()
  const city           = assessment.city ? `${assessment.city} — ` : ''

  const paragraphs: FormulaLogicParagraph[] = []

  // ─── 1. Location → Base formula ─────────────────────────────────────────
  const climateBase = CLIMATE_BASES[climateZone]
    || 'your local climate — base formula adjusted for your environmental conditions'
  const climateCtx  = CLIMATE_CONTEXT[climateZone] || ''

  paragraphs.push({
    arrow: `Your location (${city}${climateBase}) determines the base formula.`,
    body:  climateCtx,
  })

  // ─── 2. Skin type × climate intersection ────────────────────────────────
  const skinTypeSentences: Record<string, Record<string, string>> = {
    dry: {
      humid_tropical: 'Dry skin in a tropical climate is a specific presentation — you lose moisture differently than dry skin in cold climates. Dryness here is barrier dysfunction under humidity, not simple dehydration. Your formula addresses both.',
      semi_arid:      'Dry skin in a hot dry climate faces compounding moisture loss — from low humidity outside and barrier dysfunction. Your formula rebuilds the barrier while preventing further transepidermal water loss.',
      default:        'Dry skin requires a barrier-first approach. Your formula prioritises moisture retention and barrier repair alongside any active treatment.',
    },
    oily: {
      humid_tropical: 'Oily skin in a tropical climate is a high-sebum environment — formulas that are too occlusive will trigger congestion. Your lightweight base allows actives to penetrate without trapping sebum.',
      semi_arid:      'Oily skin in dry heat can be misleading — the skin overproduces sebum in response to dehydration. Your formula regulates sebum without stripping moisture.',
      default:        'Oily skin requires a non-comedogenic base that delivers actives without increasing sebum production. Your formula is calibrated for this.',
    },
    combination: {
      default: 'Combination skin requires zone-specific calibration — your formula is designed to regulate oil in the T-zone without over-drying the drier areas of the face.',
    },
    sensitive: {
      default: 'Sensitive skin places strict limits on active concentrations. Every ingredient in your formula has been selected for minimal reactivity risk.',
    },
    normal: {
      default: 'Your skin profile allows for effective active concentrations without heightened reactivity risk. Your formula is calibrated accordingly.',
    },
  }

  const skinCtxMap = skinTypeSentences[skinType] || skinTypeSentences['normal']
  const skinText   = skinCtxMap[climateZone] || skinCtxMap['default'] || ''
  if (skinText) {
    paragraphs.push({
      arrow: `Your skin type (${skinType}) in this climate creates a specific presentation.`,
      body:  skinText,
    })
  }

  // ─── 3. Primary concern → Active selection ──────────────────────────────
  const activeRationale = CONCERN_ACTIVES[primaryConcern]
  if (activeRationale) {
    const concernLabel = primaryConcern.replace(/_/g, ' ')
    paragraphs.push({
      arrow: `Your primary concern (${concernLabel}) determines the active ingredient selection.`,
      body:  `Your formula prioritises ${activeRationale}.`,
    })
  }

  // ─── 4. Formula tier → Concentration calibration ───────────────────────
  const tierText = TIER_CONTEXT[formulaTier]
  if (tierText) {
    paragraphs.push({
      arrow: 'Your formula tier reflects your sensitivity and tolerance profile.',
      body:  `Formula tier: ${tierText}`,
    })
  }

  return paragraphs
}
