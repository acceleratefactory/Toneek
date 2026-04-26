// src/lib/analysis/metricContext.ts
// Static clinical context statements for each of the 8 metric cards.
// Mapped from metric key + score to a one-sentence clinical statement.
// No API calls, no side effects. Pure constants.
// Per toneek_final_five_upgrades.md — GAP 2.

/**
 * Returns a one-sentence clinical context statement for a metric card.
 * metricTitle must match the exact title strings used in MetricGrid.tsx.
 * score is the raw metric score (not the display/inverted score).
 */
export function getMetricContext(metricTitle: string, score: number): string {
  switch (metricTitle) {

    case 'BARRIER INTEGRITY':
      if (score >= 80) return 'Barrier is functioning well for your climate.'
      if (score >= 60) return 'Within expected range for your skin type and climate combination.'
      return 'Barrier disruption is common with your skin history. Your formula targets this directly.'

    case 'MELANIN SENSITIVITY':
      // Displayed inversely — raw score is sensitivity level (higher = more sensitive)
      return 'High melanin sensitivity is common in FST V–VI skin. Your formula accounts for this at every step.'

    case 'CLIMATE STRESS':
      // Raw score — higher = more stress
      if (score > 50) return 'Humid tropical climate produces the highest environmental stress in our system. Your base formula is specifically selected for this.'
      if (score >= 30) return 'Your climate creates manageable environmental pressure. Formula base accounts for this.'
      return 'Your climate is relatively stable for skin health.'

    case 'PIGMENTATION LOAD':
      // Higher score = less load (closer to clear skin)
      if (score < 40) return 'Significant pigmentation requires a multi-pathway approach. Your formula targets melanin production and transfer simultaneously.'
      if (score < 70) return 'Visible marks responding to treatment actives. Timeline: 6–12 weeks for measurable improvement.'
      return 'Minimal active pigmentation. Maintenance and prevention focus.'

    case 'OIL BALANCE':
      if (score < 40) return 'Significant sebum excess in humid climate. Lightweight gel base and Salicylic Acid/Niacinamide address this as primary factor.'
      if (score <= 60) return 'Mild sebum excess is the most common presentation in your climate. Formula accounts for this as secondary factor.'
      return 'Sebum production is within normal range. Formula focuses on your primary concern.'

    case 'INFLAMMATION LEVEL':
      // Higher score = less inflammation (closer to calm)
      if (score < 35) return 'Elevated inflammation is the primary driver of PIH in FST IV–VI skin. Formula prioritises anti-inflammatory actives.'
      if (score < 65) return 'Low-level inflammation present. Anti-inflammatory actives included as secondary support.'
      return 'No significant inflammatory signals. Formula focuses on primary concern.'

    case 'HYDRATION STATUS':
      if (score < 50) return 'Significant moisture deficit. Formula includes barrier repair actives and rich cream base.'
      if (score < 75) return 'Mild dehydration. Formula includes humectants and barrier support.'
      return 'Skin moisture levels are healthy. Hydration maintained as secondary priority.'

    case 'TREATMENT TOLERANCE':
      if (score >= 75) return 'Skin can handle full clinical concentration actives. Formula calibrated for maximum efficacy.'
      if (score >= 50) return 'Standard concentrations appropriate. Protocol includes careful introduction sequence.'
      return 'Conservative concentrations required. Barrier-first approach before full active treatment.'

    default:
      return ''
  }
}
