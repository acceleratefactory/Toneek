// src/lib/protocol/generateProtocol.ts
// Generates a personalised behavioural protocol from formula_code and formula_tier.
// Pure function — no database calls, no side effects.

export interface ProtocolSection {
  application: string[]
  avoid: string[]
  useAlongside: string[]
  firstWeek: string[]
}

export function generateProtocol(
  formula_code: string,
  formula_tier?: string,
  active_modules?: { name: string }[],
  pregnant_or_breastfeeding?: boolean,
): ProtocolSection {
  const code = (formula_code || '').toUpperCase()
  const tier  = (formula_tier  || '').toLowerCase()
  const activeNames = (active_modules || []).map(a => (a.name || '').toLowerCase())

  const isRestorationProtocol = tier === 'restoration' || code.includes('RP')
  const hasSalicylicAcid      = activeNames.includes('salicylic acid') || code === 'LG-OA-01'
  const hasBakuchiol           = activeNames.includes('bakuchiol')
  const isPregnancySafe        = !!pregnant_or_breastfeeding

  // ─── APPLICATION ──────────────────────────────────────────────────────────
  const application: string[] = []

  if (isRestorationProtocol) {
    application.push('Apply twice daily — morning and evening.')
    application.push('Barrier repair requires consistent AM and PM application.')
  } else {
    application.push('Apply once nightly for the first 7 days.')
    application.push('If no irritation after 7 days, continue nightly use.')
  }

  application.push('Fingertip amount — approximately 0.5ml per application.')
  application.push('Apply to clean, dry skin before moisturiser.')

  if (hasBakuchiol) {
    application.push('Bakuchiol does not cause photosensitivity — morning use is safe if preferred.')
  }

  // ─── WHAT TO AVOID ────────────────────────────────────────────────────────
  const avoid: string[] = []

  if (!isPregnancySafe) {
    // Standard actives to avoid
    avoid.push('Chemical exfoliants (AHA/BHA products)')
    avoid.push('Retinol or retinoid products')
    avoid.push('Abrasive scrubs or brushes')
    avoid.push('Other active serums on the same evening')

    if (hasSalicylicAcid) {
      avoid.push('Combining with any other exfoliant — this formula already contains Salicylic Acid')
    }
  } else {
    // Pregnancy-safe: lighter avoidance list
    avoid.push('Abrasive scrubs or brushes')
    avoid.push('Other active serums on the same evening')
    avoid.push('Chemical exfoliants without checking with your doctor first')
  }

  // ─── USE ALONGSIDE ────────────────────────────────────────────────────────
  const useAlongside: string[] = [
    'A gentle, fragrance-free cleanser',
    'A simple, unfragranced moisturiser',
    'Sunscreen in the morning (non-negotiable — especially for pigmentation concerns)',
  ]

  // ─── FIRST WEEK EXPECTATIONS ──────────────────────────────────────────────
  const firstWeek: string[] = [
    'Mild tingling or warmth in the first few applications is normal and expected. This is not a reaction — it is the actives making contact with the skin.',
    'If you experience burning, redness that does not fade within 20 minutes, or visible irritation: stop application for 48 hours and complete your check-in immediately.',
  ]

  if (isRestorationProtocol) {
    firstWeek.push('Your formula is calibrated for barrier recovery. Expect reduced tightness and sensitivity within the first two weeks.')
  }

  return { application, avoid, useAlongside, firstWeek }
}
