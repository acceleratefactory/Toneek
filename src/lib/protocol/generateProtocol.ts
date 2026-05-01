// src/lib/protocol/generateProtocol.ts
// Generates a personalised behavioural protocol from formula_code, formula_tier, and routine_expectation.

export interface ProtocolInput {
  formula_code: string
  formula_tier: string      // 'conservative' | 'standard' | 'optimised' | 'restoration'
  routine_expectation: string  // 'just_one' | 'two_to_three' | 'whatever_it_takes'
  primary_concern: string
  climate_zone: string
  skin_type: string
  barrier_integrity: number  // from analysis_scores
  analysis_scores: Record<string, number>
}

export interface ProtocolStep {
  step: number
  product: string
  instruction: string
  timing?: string | null
  note?: string
}

export function generateProtocol(input: ProtocolInput) {
  const { formula_tier, routine_expectation, formula_code } = input

  // Is this a restoration protocol formula?
  const is_restoration = formula_tier === 'restoration' || 
                         (formula_code ? formula_code.startsWith('RP-') : false)

  switch (routine_expectation) {
    case 'just_one':
      return generateSingleProductProtocol(input, is_restoration)
    case 'two_to_three':
      return generateThreeProductProtocol(input, is_restoration)
    case 'whatever_it_takes':
      return generateFullRoutineProtocol(input, is_restoration)
    default:
      return generateSingleProductProtocol(input, is_restoration)
  }
}

function generateSingleProductProtocol(input: ProtocolInput, is_restoration: boolean) {
  return {
    routine_type: 'single_product' as const,
    application_instructions: is_restoration
      ? [
          'Apply twice daily — morning and evening.',
          'Barrier repair requires consistent AM and PM application.',
          'Fingertip amount — approximately 0.5ml per application.',
          'Apply to clean, dry skin before moisturiser.',
        ]
      : [
          'Apply once nightly for the first 7 days.',
          'If no irritation after 7 days, continue nightly use.',
          'Fingertip amount — approximately 0.5ml per application.',
          'Apply to clean, dry skin before moisturiser.',
          'Bakuchiol does not cause photosensitivity — morning use is safe if preferred.',
        ],
    use_alongside: [
      'A gentle, fragrance-free cleanser',
      'A simple, unfragranced moisturiser',
      'Sunscreen in the morning (non-negotiable — especially for pigmentation concerns)',
    ],
    what_to_avoid: getAvoidList(input),
    first_week_note: getFirstWeekNote(input, is_restoration),
  }
}

function generateThreeProductProtocol(input: ProtocolInput, is_restoration: boolean) {
  const morning_steps = generateMorningSteps(input, is_restoration)
  const evening_steps = generateEveningSteps(input, is_restoration)

  return {
    routine_type: 'two_to_three' as const,
    morning: {
      title: 'MORNING ROUTINE',
      steps: morning_steps,
    },
    evening: {
      title: 'EVENING ROUTINE',
      steps: evening_steps,
    },
    what_to_avoid: getAvoidList(input),
    first_week_note: getFirstWeekNote(input, is_restoration),
    general_notes: [
      'Allow 60 seconds between each product for absorption.',
      'Your cleanser and moisturiser are formulated to be compatible with your formula.',
      'Do not substitute your included products with alternatives during the first 8 weeks.',
    ],
  }
}

function generateMorningSteps(input: ProtocolInput, is_restoration: boolean): ProtocolStep[] {
  const { skin_type, climate_zone } = input

  const cleanser_note = skin_type === 'dry' || input.barrier_integrity < 60
    ? 'Use lukewarm water — not hot. Hot water strips barrier lipids.'
    : 'Massage gently for 60 seconds. Rinse thoroughly.'

  const steps: ProtocolStep[] = [
    {
      step: 1,
      product: 'Toneek Cleanser',
      instruction: `Apply a small amount to damp skin. ${cleanser_note}`,
      timing: null,
    },
  ]

  if (is_restoration) {
    steps.push({
      step: 2,
      product: 'Your Toneek Formula',
      instruction: 'Apply 0.5ml to clean, dry skin. Allow 60 seconds to absorb.',
      timing: null,
    })
    steps.push({
      step: 3,
      product: 'Toneek Moisturiser',
      instruction: 'Apply a pea-sized amount to seal in the formula.',
      timing: null,
    })
  } else {
    steps.push({
      step: 2,
      product: 'Toneek Moisturiser',
      instruction: 'Apply a pea-sized amount to clean, dry skin.',
      timing: null,
    })
  }

  const spf_note = climate_zone === 'humid_tropical' || climate_zone === 'equatorial' || climate_zone === 'semi_arid'
    ? 'SPF 50+ is non-negotiable in your climate. UV exposure is the primary trigger for PIH.'
    : 'Apply SPF 30+ as the final step. Do not skip.'

  steps.push({
    step: steps.length + 1,
    product: 'Sunscreen (SPF 50+)',
    instruction: spf_note,
    note: 'Source your own SPF — it is not included in this tier. Recommended: any mineral SPF without fragrance.',
    timing: null,
  })

  return steps
}

function generateEveningSteps(input: ProtocolInput, is_restoration: boolean): ProtocolStep[] {
  const { skin_type, barrier_integrity } = input

  const cleanser_note = skin_type === 'dry'
    ? 'Double cleanse if you wore SPF or makeup. First cleanse removes SPF, second cleanse cleans skin.'
    : 'Cleanse once. Remove all SPF and any makeup before applying formula.'

  if (is_restoration) {
    return [
      {
        step: 1,
        product: 'Toneek Cleanser',
        instruction: cleanser_note,
        timing: null,
      },
      {
        step: 2,
        product: 'Your Toneek Formula',
        instruction: 'Second application of the day. 0.5ml. Allow 60 seconds.',
        timing: null,
      },
      {
        step: 3,
        product: 'Toneek Moisturiser',
        instruction: 'Apply generously. Evening moisture supports the barrier repair process overnight.',
        timing: null,
      },
    ]
  }

  return [
    {
      step: 1,
      product: 'Toneek Cleanser',
      instruction: cleanser_note,
      timing: null,
    },
    {
      step: 2,
      product: 'Your Toneek Formula',
      instruction: 'Apply 0.5ml to clean, dry skin. This is your active treatment step. Allow 90 seconds to fully absorb before next step.',
      timing: null,
    },
    {
      step: 3,
      product: 'Toneek Moisturiser',
      instruction: barrier_integrity < 60
        ? 'Apply generously. Your barrier needs hydration support to work alongside the actives.'
        : 'Apply a pea-sized amount. Seal in the formula and support overnight repair.',
      timing: null,
    },
  ]
}

function generateFullRoutineProtocol(input: ProtocolInput, is_restoration: boolean) {
  const fourth_product = getFourthProduct(input)

  const morning_steps: ProtocolStep[] = [
    {
      step: 1,
      product: 'Toneek Cleanser',
      instruction: 'Cleanse with lukewarm water. 60-second massage.',
      timing: null,
    },
    ...(fourth_product.timing === 'morning' ? [{
      step: 2,
      product: fourth_product.name,
      instruction: fourth_product.morning_instruction || '',
      timing: null,
    }] : []),
    {
      step: fourth_product.timing === 'morning' ? 3 : 2,
      product: 'Toneek Moisturiser',
      instruction: 'Apply pea-sized amount.',
      timing: null,
    },
    {
      step: fourth_product.timing === 'morning' ? 4 : 3,
      product: 'Sunscreen SPF 50+',
      instruction: 'Final step, every morning without exception.',
      timing: null,
    },
  ]

  const evening_steps: ProtocolStep[] = [
    {
      step: 1,
      product: 'Toneek Cleanser',
      instruction: 'Double cleanse if SPF or makeup was worn.',
      timing: null,
    },
    ...(fourth_product.timing === 'evening' ? [{
      step: 2,
      product: fourth_product.name,
      instruction: fourth_product.evening_instruction || '',
      timing: null,
    }] : []),
    {
      step: fourth_product.timing === 'evening' ? 3 : 2,
      product: 'Your Toneek Formula',
      instruction: '0.5ml. This is your active treatment step. 90 seconds absorption before next product.',
      timing: null,
    },
    {
      step: fourth_product.timing === 'evening' ? 4 : 3,
      product: 'Toneek Moisturiser',
      instruction: 'Seal in the formula. Apply generously on barrier-compromised skin.',
      timing: null,
    },
  ]

  return {
    routine_type: 'full_routine' as const,
    morning: {
      title: 'MORNING ROUTINE',
      steps: morning_steps,
    },
    evening: {
      title: 'EVENING ROUTINE',
      steps: evening_steps,
    },
    fourth_product_note: `Your ${fourth_product.name} is included because: ${fourth_product.rationale}`,
    what_to_avoid: getAvoidList(input),
    first_week_note: getFirstWeekNote(input, is_restoration),
    general_notes: [
      'Your complete routine is sequenced for maximum compatibility with your formula.',
      'All four products are matched to each other and to your skin profile.',
      'Do not add additional actives during the first 8 weeks.',
      'If your skin reacts to any product: stop the suspect product only, not the formula.',
    ],
  }
}

function getFourthProduct(input: ProtocolInput) {
  const { primary_concern, climate_zone, skin_type, barrier_integrity } = input

  if (['equatorial', 'semi_arid', 'humid_tropical'].includes(climate_zone || '') 
      && primary_concern === 'PIH') {
    return {
      name: 'Toneek Mineral SPF 50',
      timing: 'morning',
      morning_instruction: 'Apply after moisturiser. 2-finger rule: two finger-lengths of SPF for full coverage.',
      evening_instruction: null,
      rationale: 'UV exposure is the primary trigger for PIH in your climate. SPF is the single most important PIH prevention tool.',
    }
  }

  if ((skin_type === 'dry' || barrier_integrity < 60) 
      && ['temperate_maritime', 'cold_continental'].includes(climate_zone || '')) {
    return {
      name: 'Toneek Hydrating Toner',
      timing: 'evening',
      morning_instruction: 'Apply after cleanser. Pat gently, do not rub.',
      evening_instruction: 'Apply after cleanser. First step of evening routine, before formula.',
      rationale: 'Cold climate dramatically reduces ambient humidity. Your skin needs an additional hydration layer to maintain barrier function.',
    }
  }

  if (['PIH', 'tone'].includes(primary_concern || '')) {
    return {
      name: 'Toneek Brightening Toner',
      timing: 'evening',
      morning_instruction: null,
      evening_instruction: 'Apply after cleanser. Pat gently into skin before formula application.',
      rationale: 'Prepares the skin surface for maximum Niacinamide and brightening active penetration.',
    }
  }

  return {
    name: 'Toneek Mineral SPF 50',
    timing: 'morning',
    morning_instruction: 'Apply after moisturiser as the final step.',
    evening_instruction: null,
    rationale: 'UV protection is essential with active brightening and barrier treatment ingredients.',
  }
}

function getAvoidList(input: ProtocolInput): string[] {
  const base = [
    'Chemical exfoliants (AHA/BHA products) — unless they are in your Toneek routine',
    'Retinol or retinoid products',
    'Abrasive scrubs or brushes',
  ]

  if (input.routine_expectation !== 'just_one') {
    base.push('Substitute products — use only the products in your Toneek routine during the first 8 weeks')
  } else {
    base.push('Other active serums on the same evening')
  }

  if (input.barrier_integrity < 60) {
    base.push('Any new products not in your current routine — your barrier needs stability')
  }

  return base
}

function getFirstWeekNote(input: ProtocolInput, is_restoration: boolean): string {
  const { routine_expectation } = input

  const base = 'Mild tingling or warmth in the first few applications is normal and expected. This is not a reaction — it is the actives making contact with the skin.'

  const reaction_note = 'If you experience burning, redness that does not fade within 20 minutes, or visible irritation: stop application for 48 hours and complete your check-in immediately.'

  const multi_product_note = routine_expectation !== 'just_one'
    ? '\n\nFor multi-product routines: introduce each product one at a time over the first week. Use just the cleanser for days 1–2. Add moisturiser on day 3. Add your formula on day 5. This identifies any individual product reactions.'
    : ''

  const restoration_note = is_restoration
    ? '\n\nYour formula is calibrated for barrier recovery. Expect reduced tightness and sensitivity within the first two weeks.'
    : ''

  return base + '\n\n' + reaction_note + multi_product_note + restoration_note
}
