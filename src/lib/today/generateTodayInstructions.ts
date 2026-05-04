// src/lib/today/generateTodayInstructions.ts

export function generateDoTodayInstructions(
  routine_expectation: string,
  days_since_receipt: number,
  is_restoration: boolean
): { do_today: string | string[], context: string | null, timing_note: string | null } {
  
  if (routine_expectation === 'just_one') {
    return {
      do_today: is_restoration
        ? 'Apply your formula morning and evening. 0.5ml each application.'
        : 'Apply your formula tonight at bedtime. 0.5ml — pea-sized amount.',
      context: null,
      timing_note: null
    }
  }

  if (routine_expectation === 'two_to_three') {
    const specific = generateThreeProductToday({ days_since_receipt }, is_restoration)
    if (specific) return specific
    
    // Fallback logic for days 14+
    return {
      do_today: [
        'MORNING:',
        '1. Cleanser, then Moisturiser, then SPF',
        'EVENING:',
        '1. Cleanser',
        '2. Toneek Formula (wait 90 seconds)',
        '3. Toneek Moisturiser'
      ],
      context: null,
      timing_note: null
    }
  }

  if (routine_expectation === 'whatever_it_takes') {
    const specific = generateFullRoutineToday({ days_since_receipt }, is_restoration)
    if (specific) return specific
    
    // Fallback logic for days 7+
    return {
      do_today: [
        'MORNING:',
        '1. Cleanser, then Moisturiser, then SPF 50+',
        'EVENING:',
        '1. Cleanser (double cleanse to remove SPF)',
        '2. Toneek Formula (wait 90 seconds)',
        '3. Toneek Moisturiser'
      ],
      context: null,
      timing_note: null
    }
  }

  return { do_today: '', context: null, timing_note: null }
}

function generateThreeProductToday(input: any, is_restoration: boolean) {
  const { days_since_receipt } = input

  // ── DAY 1 (received today) ──────────────────────────────────────────
  if (days_since_receipt === 0) {
    return {
      do_today: [
        'Wash with your Toneek cleanser tonight.',
        'Do NOT apply your formula yet.',
        'Apply your Toneek moisturiser after cleansing.',
      ],
      context: 'We introduce products one at a time. Tonight is cleanser + moisturiser only.',
      timing_note: null,
    }
  }

  // ── DAY 2 ───────────────────────────────────────────────────────────
  if (days_since_receipt === 1) {
    return {
      do_today: [
        'Cleanse with your Toneek cleanser — morning and evening.',
        'Apply your Toneek moisturiser after each cleanse.',
        'Do NOT apply your formula yet.',
      ],
      context: 'Day 2 — cleanser and moisturiser only. Your formula begins tomorrow.',
      timing_note: null,
    }
  }

  // ── DAY 3 — formula introduction day ───────────────────────────────
  if (days_since_receipt === 2) {
    return {
      do_today: [
        'Tonight: cleanse → apply your Toneek formula (0.5ml) → moisturise.',
        'This is your first formula application.',
        'Mild tingling is normal — it means the actives are working.',
      ],
      context: is_restoration
        ? 'Day 3 — your formula begins today. Apply morning and evening from now on.'
        : 'Day 3 — your formula begins tonight. Apply every evening going forward.',
      timing_note: is_restoration
        ? 'MORNING: Cleanse → Formula → Moisturise\nEVENING: Cleanse → Formula → Moisturise'
        : 'EVENING: Cleanse → Formula (0.5ml) → Moisturise\nMORNING: Cleanse → Moisturise only',
    }
  }

  // ── DAYS 4–6 — establishing the routine ────────────────────────────
  if (days_since_receipt >= 3 && days_since_receipt <= 5) {
    const day_label = `Day ${days_since_receipt + 1}`
    return {
      do_today: is_restoration
        ? [
            `${day_label} — apply your full routine morning and evening.`,
            'Cleanse → Formula → Moisturise (both AM and PM).',
            'Consistency now determines your Week 2 outcome.',
          ]
        : [
            `${day_label} — keep your evening routine consistent.`,
            'Evening: Cleanse → Formula (0.5ml) → Moisturise.',
            'Morning: Cleanse → Moisturise only.',
          ],
      context: 'You are in the routine establishment phase. Every application counts.',
      timing_note: null,
    }
  }

  // ── DAYS 7–13 — week 1 consolidation ───────────────────────────────
  if (days_since_receipt >= 6 && days_since_receipt <= 13) {
    return {
      do_today: is_restoration
        ? [
            'Apply your formula morning and evening.',
            '0.5ml each application — pea-sized amount.',
            'Sunscreen is non-negotiable in your morning routine.',
          ]
        : [
            'Apply your formula this evening.',
            '0.5ml — pea-sized amount to clean, dry skin.',
            'Allow 90 seconds to absorb before moisturising.',
          ],
      context: null,
      timing_note: null,
    }
  }

  // ── DAYS 14+ — ongoing protocol ────────────────────────────────────
  return null  // fall through to existing week logic
}

function generateFullRoutineToday(input: any, is_restoration: boolean) {
  const { days_since_receipt } = input

  if (days_since_receipt === 0) {
    return {
      do_today: [
        'Wash with your Toneek cleanser tonight.',
        'Apply your Toneek moisturiser.',
        'Do NOT apply your formula or fourth product yet.',
      ],
      context: 'Day 1 — cleanser and moisturiser only tonight.',
      timing_note: null,
    }
  }

  if (days_since_receipt === 1) {
    return {
      do_today: [
        'Cleanse and moisturise morning and evening.',
        'No formula or fourth product yet.',
      ],
      context: 'Day 2 — cleanser + moisturiser building tolerance.',
      timing_note: null,
    }
  }

  if (days_since_receipt === 2) {
    return {
      do_today: [
        'Cleanse and moisturise as normal.',
        'Still no formula tonight — one more day.',
      ],
      context: 'Day 3 — nearly there. Formula begins Day 4.',
      timing_note: null,
    }
  }

  if (days_since_receipt === 3) {
    return {
      do_today: [
        'Tonight: add your Toneek formula for the first time.',
        'Routine: Cleanse → Formula (0.5ml) → Moisturise.',
        'Mild tingling is expected — this is normal.',
      ],
      context: 'Day 4 — your active treatment begins tonight.',
      timing_note: 'MORNING: Cleanse → Moisturise\nEVENING: Cleanse → Formula → Moisturise',
    }
  }

  if (days_since_receipt === 4) {
    return {
      do_today: [
        'Day 5 — same evening routine as last night.',
        'Formula beginning to establish in your skin.',
        'Your fourth product (SPF/Toner/Booster) begins tomorrow.',
      ],
      context: 'Day 5 — formula consolidation. Fourth product tomorrow.',
      timing_note: null,
    }
  }

  if (days_since_receipt === 5) {
    return {
      do_today: [
        'Today your fourth product enters the routine.',
        'Morning: Cleanse → [Fourth product] → Moisturise.',
        'Evening: Cleanse → Formula → Moisturise.',
      ],
      context: 'Day 6 — your complete 4-product routine is now active.',
      timing_note: 'MORNING:\n1. Cleanse\n2. [Fourth product]\n3. Moisturise\n\nEVENING:\n1. Cleanse\n2. Formula (0.5ml)\n3. Moisturise',
    }
  }

  // Day 7+ — fall through to existing week logic
  return null
}
