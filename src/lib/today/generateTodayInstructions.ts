// src/lib/today/generateTodayInstructions.ts

export function generateDoTodayInstructions(
  routine_expectation: string,
  days_since_receipt: number,
  is_restoration: boolean
): string | string[] {
  // Single product tier
  if (routine_expectation === 'just_one') {
    if (is_restoration) {
      return 'Apply your formula morning and evening. 0.5ml each application.'
    }
    return 'Apply your formula tonight at bedtime. 0.5ml — pea-sized amount.'
  }

  // Multi-product tiers: Staggered Introduction Phase
  if (days_since_receipt < 2) {
    return [
      '1. Wash with your Toneek cleanser tonight.',
      '2. Do NOT apply your formula yet.',
      '3. Apply your Toneek moisturiser.',
      '* We introduce the formula on Day 3 to prevent overwhelming your barrier.'
    ]
  }

  if (days_since_receipt < 5) {
    return [
      '1. Wash with your Toneek cleanser tonight.',
      '2. Apply your formula (0.5ml) — wait 60 seconds.',
      '3. Apply your Toneek moisturiser.'
    ]
  }

  // Multi-product tiers: Full Routine Phase (Day 5 onwards)
  if (routine_expectation === 'whatever_it_takes') {
    return [
      'MORNING:',
      '1. Cleanser, then Moisturiser, then SPF 50+',
      'EVENING:',
      '1. Cleanser (double cleanse to remove SPF)',
      '2. Toneek Formula (wait 90 seconds)',
      '3. Toneek Moisturiser'
    ]
  }

  // two_to_three products
  return [
    'MORNING:',
    '1. Cleanser, then Moisturiser, then SPF',
    'EVENING:',
    '1. Cleanser',
    '2. Toneek Formula (wait 90 seconds)',
    '3. Toneek Moisturiser'
  ]
}
