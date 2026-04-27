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
