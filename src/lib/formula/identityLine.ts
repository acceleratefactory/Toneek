// src/lib/formula/identityLine.ts
// Pure functions for generating the personal identity lines.
// No imports, no side effects.
// Per toneek_final_polish.md — Phase 1.

// ─── Results page: replaces "Real-time clinical intelligence mapping" ─────────

export function getIdentityLine(climateZone: string, skinType: string): string {
  const zone = (climateZone || '').toLowerCase()
  const type = (skinType || '').toLowerCase()

  if (zone === 'humid_tropical') {
    if (type === 'oily') return 'Built for melanin-rich skin in hot, humid climates.'
    if (type === 'dry')  return 'Built for melanin-rich skin managing dryness in tropical heat.'
    return 'Built for melanin-rich skin in hot, humid climates.'
  }
  if (zone === 'semi_arid')          return 'Built for melanin-rich skin in dry, high-UV environments.'
  if (zone === 'temperate_maritime') return 'Built for melanin-rich skin adapting to damp, cool climates.'
  if (zone === 'cold_continental')   return 'Built for melanin-rich skin managing cold-climate barrier stress.'
  if (zone === 'mediterranean')      return 'Built for melanin-rich skin in warm, UV-rich climates.'
  if (zone === 'equatorial')         return 'Built for melanin-rich skin in extreme heat and humidity.'

  return 'Built for melanin-rich skin. Wherever you are.'
}

// ─── Dashboard page: small 12px subtitle below formula name ──────────────────

const CLIMATE_DESCRIPTIONS: Record<string, string> = {
  humid_tropical:    'Hot and humid climate',
  equatorial:        'Extreme heat and humidity',
  semi_arid:         'Dry, high-UV climate',
  temperate_maritime:'Damp, cool climate',
  cold_continental:  'Cold continental climate',
  mediterranean:     'Warm, UV-rich climate',
}

export function getDashboardIdentityLine(climateZone: string, skinType: string): string {
  const zone = (climateZone || '').toLowerCase()
  const type = (skinType || '').toLowerCase()

  const climateDesc = CLIMATE_DESCRIPTIONS[zone] || 'Your climate'
  const typeDesc    = type ? `${type} presentation` : 'your presentation'

  return `Built for your skin. ${climateDesc}, ${typeDesc}.`
}

// ─── Formula summary line — FormulaCard, below formula name ──────────────────
// Per toneek_dashboard_final_polish.md — Phase 2.

const TIER_PREFIX: Record<string, string> = {
  conservative: 'A gentle, ',
  standard:     'A clinical-strength, ',
  optimised:    'A high-efficacy, ',
  restoration:  'A barrier-first, ',
}

const CLIMATE_SUMMARY: Record<string, string> = {
  humid_tropical:     'lightweight tropical-optimised',
  semi_arid:          'moisture-balancing arid-climate',
  temperate_maritime: 'barrier-supportive cool-climate',
  cold_continental:   'intensive barrier cold-climate',
  mediterranean:      'UV-adapted Mediterranean-climate',
  equatorial:         'ultra-lightweight high-humidity',
}

const CONCERN_ACTION: Record<string, string> = {
  PIH:         'targeting post-inflammatory pigmentation',
  tone:        'evening skin tone and reducing discolouration',
  acne:        'clearing active breakouts and preventing PIH',
  dryness:     'repairing the moisture barrier',
  sensitivity: 'calming reactivity and rebuilding barrier tolerance',
  oiliness:    'regulating sebum and reducing congestion',
  texture:     'refining texture and improving skin uniformity',
}

export function getFormulaSummaryLine(
  formulaTier:    string | null | undefined,
  climateZone:    string | null | undefined,
  primaryConcern: string | null | undefined,
): string {
  const tier    = (formulaTier    || '').toLowerCase()
  const zone    = (climateZone    || '').toLowerCase()
  const concern = (primaryConcern || '')

  const prefix  = TIER_PREFIX[tier]    || 'A clinical-strength, '
  const climate = CLIMATE_SUMMARY[zone] || 'climate-calibrated'
  const action  = CONCERN_ACTION[concern] || 'addressing your primary skin concern'

  return `${prefix}${climate} formula — ${action}.`
}
