// src/lib/email/emailHelpers.ts
// Data maps and helpers for dynamic formula email content.

export const CLIMATE_DESCRIPTIONS: Record<string, string> = {
  humid_tropical: 'hot and humid tropical climate',
  equatorial: 'extreme equatorial heat and humidity',
  semi_arid: 'hot, dry, and high-UV climate',
  temperate_maritime: 'cool, damp, and low-humidity climate',
  cold_continental: 'cold continental climate with severe barrier stress',
  mediterranean: 'warm, dry Mediterranean climate',
}

export function getClimateDescription(climate_zone: string): string {
  return CLIMATE_DESCRIPTIONS[climate_zone] ?? 'your specific climate zone'
}

export const CONCERN_LABELS: Record<string, string> = {
  PIH: 'post-inflammatory hyperpigmentation (PIH)',
  tone: 'uneven skin tone and discolouration',
  acne: 'active breakouts and post-acne marks',
  dryness: 'dryness and moisture barrier repair',
  sensitivity: 'sensitivity and barrier inflammation',
  oiliness: 'excess sebum and oil imbalance',
  texture: 'skin texture and surface irregularity',
  ageing: 'skin renewal and texture refinement',
}

export function getPrimaryConcernLabel(primary_concern: string): string {
  return CONCERN_LABELS[primary_concern] ?? primary_concern
}

export const WEEK_EXPECTATIONS: Record<string, { week2: string; week4: string; week8: string }> = {
  PIH: {
    week2: 'Inflammation calming. No visible pigment change yet — this is expected and normal.',
    week4: 'Surface tone beginning to even. First visible lightening of post-inflammatory marks.',
    week8: 'Measurable PIH reduction. Skin OS Score recalculated from your Week 8 check-in.',
  },
  dryness: {
    week2: 'Tightness reducing. Barrier beginning to stabilise.',
    week4: 'Measurable improvement in barrier resilience and moisture retention.',
    week8: 'Skin moisture levels normalised. Formula review available from Week 6.',
  },
  acne: {
    week2: 'Breakout frequency beginning to reduce. Mild initial purging is expected and temporary.',
    week4: 'Active lesion count reducing. Post-acne marks stabilising.',
    week8: 'Measurable breakout reduction. Skin OS Score recalculated.',
  },
  sensitivity: {
    week2: 'Reactivity reducing. Any initial tingling normalises by Day 5.',
    week4: 'Barrier measurably more resilient. Sensitivity threshold improving.',
    week8: 'Sensitivity significantly reduced. Skin OS Score recalculated.',
  },
  oiliness: {
    week2: 'Sebum production beginning to regulate. Pore appearance reducing.',
    week4: 'Oil balance measurably improved. Shine significantly reduced.',
    week8: 'Skin OS Score recalculated. Formula review available.',
  },
  tone: {
    week2: 'Melanin transfer beginning to slow. No visible change yet — this is normal.',
    week4: 'Surface discolouration beginning to lift. Even tone starting to emerge.',
    week8: 'Measurable tone improvement. Skin OS Score recalculated.',
  },
  texture: {
    week2: 'Cell turnover beginning. Surface smoothness not yet visible.',
    week4: 'Texture refinement beginning. Pore appearance improving.',
    week8: 'Measurable texture improvement. Skin OS Score recalculated.',
  },
  default: {
    week2: 'Skin beginning to adjust to the active protocol.',
    week4: 'First measurable changes visible.',
    week8: 'Skin OS Score recalculated from your Week 8 check-in.',
  }
}

export function getWeekExpectations(primary_concern: string) {
  return WEEK_EXPECTATIONS[primary_concern] ?? WEEK_EXPECTATIONS.default
}
