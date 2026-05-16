// src/lib/climate.ts

export type ClimateZone = 
  | 'humid_tropical'
  | 'equatorial'
  | 'semi_arid'
  | 'temperate_maritime'
  | 'cold_continental'
  | 'mediterranean'

// ─────────────────────────────────────────────────────────────────
// PART 1: COUNTRY TO CLIMATE MAP
// Coverage: all countries where Toneek has customers or is likely to
// This list handles Priority 2
// ─────────────────────────────────────────────────────────────────

const COUNTRY_CLIMATE_MAP: Record<string, ClimateZone> = {

  // ── WEST AFRICA (humid_tropical) ─────────────────────────────
  'Nigeria': 'humid_tropical',
  'Ghana': 'humid_tropical',
  'Sierra Leone': 'humid_tropical',
  'Liberia': 'humid_tropical',
  'Ivory Coast': 'humid_tropical',
  "Côte d'Ivoire": 'humid_tropical',
  'Togo': 'humid_tropical',
  'Benin': 'humid_tropical',
  'Guinea': 'humid_tropical',
  'Guinea-Bissau': 'humid_tropical',
  'Senegal': 'semi_arid',       // Sahel edge
  'Gambia': 'semi_arid',
  'Cape Verde': 'semi_arid',

  // ── CENTRAL AFRICA (equatorial) ──────────────────────────────
  'Cameroon': 'equatorial',
  'Gabon': 'equatorial',
  'Democratic Republic of Congo': 'equatorial',
  'DRC': 'equatorial',
  'Republic of Congo': 'equatorial',
  'Central African Republic': 'equatorial',
  'Equatorial Guinea': 'equatorial',

  // ── EAST AFRICA ──────────────────────────────────────────────
  'Kenya': 'semi_arid',
  'Tanzania': 'humid_tropical',
  'Uganda': 'equatorial',
  'Ethiopia': 'semi_arid',
  'Rwanda': 'humid_tropical',
  'Burundi': 'humid_tropical',
  'Somalia': 'semi_arid',
  'Djibouti': 'semi_arid',

  // ── SOUTHERN AFRICA ──────────────────────────────────────────
  'South Africa': 'mediterranean',  // Cape Town; inland is semi_arid
  'Zimbabwe': 'semi_arid',
  'Zambia': 'semi_arid',
  'Botswana': 'semi_arid',
  'Namibia': 'semi_arid',
  'Mozambique': 'humid_tropical',
  'Malawi': 'humid_tropical',
  'Madagascar': 'humid_tropical',
  'Mauritius': 'humid_tropical',

  // ── NORTH AFRICA ─────────────────────────────────────────────
  'Egypt': 'semi_arid',
  'Morocco': 'mediterranean',
  'Algeria': 'semi_arid',
  'Tunisia': 'mediterranean',
  'Libya': 'semi_arid',
  'Sudan': 'semi_arid',
  'South Sudan': 'semi_arid',

  // ── WEST AFRICA SAHEL ────────────────────────────────────────
  'Niger': 'semi_arid',
  'Mali': 'semi_arid',
  'Burkina Faso': 'semi_arid',
  'Chad': 'semi_arid',
  'Mauritania': 'semi_arid',

  // ── CARIBBEAN ────────────────────────────────────────────────
  'Jamaica': 'humid_tropical',
  'Trinidad and Tobago': 'humid_tropical',
  'Barbados': 'humid_tropical',
  'Bahamas': 'humid_tropical',
  'Haiti': 'humid_tropical',
  'Dominican Republic': 'humid_tropical',
  'Cuba': 'humid_tropical',
  'Guyana': 'equatorial',
  'Suriname': 'equatorial',

  // ── SOUTH AMERICA ────────────────────────────────────────────
  'Brazil': 'humid_tropical',  // north; south is temperate
  'Colombia': 'equatorial',
  'Venezuela': 'humid_tropical',
  'Ecuador': 'equatorial',
  'Peru': 'semi_arid',         // coastal; jungle is equatorial
  'Bolivia': 'semi_arid',
  'Argentina': 'temperate_maritime',
  'Chile': 'mediterranean',

  // ── UNITED KINGDOM ───────────────────────────────────────────
  'United Kingdom': 'temperate_maritime',
  'England': 'temperate_maritime',
  'Scotland': 'temperate_maritime',
  'Wales': 'temperate_maritime',
  'Northern Ireland': 'temperate_maritime',
  'Ireland': 'temperate_maritime',

  // ── WESTERN EUROPE ───────────────────────────────────────────
  'France': 'temperate_maritime',
  'Belgium': 'temperate_maritime',
  'Netherlands': 'temperate_maritime',
  'Germany': 'cold_continental',
  'Austria': 'cold_continental',
  'Switzerland': 'cold_continental',
  'Luxembourg': 'temperate_maritime',
  'Denmark': 'cold_continental',
  'Sweden': 'cold_continental',
  'Norway': 'cold_continental',
  'Finland': 'cold_continental',
  'Iceland': 'cold_continental',
  'Portugal': 'mediterranean',
  'Spain': 'mediterranean',
  'Italy': 'mediterranean',
  'Greece': 'mediterranean',
  'Malta': 'mediterranean',
  'Cyprus': 'mediterranean',

  // ── EASTERN EUROPE ───────────────────────────────────────────
  'Poland': 'cold_continental',
  'Czech Republic': 'cold_continental',
  'Czechia': 'cold_continental',
  'Slovakia': 'cold_continental',
  'Hungary': 'cold_continental',
  'Romania': 'cold_continental',
  'Bulgaria': 'cold_continental',
  'Croatia': 'mediterranean',
  'Slovenia': 'cold_continental',
  'Serbia': 'cold_continental',
  'Bosnia and Herzegovina': 'cold_continental',
  'North Macedonia': 'cold_continental',
  'Albania': 'mediterranean',
  'Kosovo': 'cold_continental',
  'Montenegro': 'mediterranean',

  // ── BALTIC STATES ────────────────────────────────────────────
  'Estonia': 'cold_continental',
  'Latvia': 'cold_continental',
  'Lithuania': 'cold_continental',

  // ── EASTERN EUROPE / RUSSIA ──────────────────────────────────
  'Russia': 'cold_continental',
  'Ukraine': 'cold_continental',
  'Belarus': 'cold_continental',
  'Moldova': 'cold_continental',

  // ── MIDDLE EAST / GULF ───────────────────────────────────────
  'United Arab Emirates': 'semi_arid',
  'UAE': 'semi_arid',
  'Saudi Arabia': 'semi_arid',
  'Qatar': 'semi_arid',
  'Kuwait': 'semi_arid',
  'Bahrain': 'semi_arid',
  'Oman': 'semi_arid',
  'Jordan': 'semi_arid',
  'Lebanon': 'mediterranean',
  'Israel': 'mediterranean',
  'Palestine': 'mediterranean',
  'Iraq': 'semi_arid',
  'Iran': 'semi_arid',
  'Turkey': 'mediterranean',   // coastal; inland cold_continental
  'Yemen': 'semi_arid',
  'Syria': 'semi_arid',

  // ── SOUTH ASIA ───────────────────────────────────────────────
  'India': 'humid_tropical',   // varies widely; tropical is most common
  'Pakistan': 'semi_arid',
  'Bangladesh': 'humid_tropical',
  'Sri Lanka': 'equatorial',
  'Nepal': 'cold_continental',

  // ── SOUTHEAST ASIA ───────────────────────────────────────────
  'Singapore': 'equatorial',
  'Malaysia': 'equatorial',
  'Indonesia': 'equatorial',
  'Philippines': 'humid_tropical',
  'Thailand': 'humid_tropical',
  'Vietnam': 'humid_tropical',
  'Cambodia': 'humid_tropical',
  'Myanmar': 'humid_tropical',

  // ── NORTH AMERICA ────────────────────────────────────────────
  'United States': 'cold_continental',  // most major cities; south is humid_tropical
  'United States of America': 'cold_continental',
  'USA': 'cold_continental',
  'Canada': 'cold_continental',
  'Mexico': 'semi_arid',

  // ── OCEANIA ──────────────────────────────────────────────────
  'Australia': 'semi_arid',      // most population in dry coast
  'New Zealand': 'temperate_maritime',

  // ── PACIFIC ISLANDS ──────────────────────────────────────────
  'Fiji': 'humid_tropical',
  'Papua New Guinea': 'equatorial',
}

// ─────────────────────────────────────────────────────────────────
// PART 2: CONTINENT FALLBACK MAP
// When a country is not in the dictionary, use the continent
// to assign a more accurate climate than a hardcoded tropical default
// ─────────────────────────────────────────────────────────────────

const CONTINENT_CLIMATE_FALLBACK: Record<string, ClimateZone> = {
  'Africa': 'semi_arid',             // safer default than tropical for unknown African countries
  'Europe': 'temperate_maritime',    // safer default than tropical for any European country
  'North America': 'cold_continental',
  'South America': 'humid_tropical',
  'Asia': 'humid_tropical',
  'Oceania': 'semi_arid',
  'Middle East': 'semi_arid',
  'Caribbean': 'humid_tropical',
}

// ─────────────────────────────────────────────────────────────────
// PART 3: ASSESSMENT INFERENCE
// When country AND continent are unknown, infer from assessment answers
// climate_transition_effects and years_in_current_location give signals
// ─────────────────────────────────────────────────────────────────

function inferClimateFromAssessment(assessment: {
  climate_transition_effects?: string[]
  years_in_current_location?: string
  skin_type?: string
}): ClimateZone {
  const effects = assessment.climate_transition_effects ?? []

  // If customer reports dryness, cold, or low humidity effects → cold/temperate
  if (effects.includes('more_dry') || effects.includes('skin_became_dry') ||
      effects.includes('cold_sensitivity')) {
    return 'cold_continental'
  }

  // If customer reports increased oiliness, heat reactions → tropical
  if (effects.includes('more_oily') || effects.includes('heat_reactive')) {
    return 'humid_tropical'
  }

  // If skin type is oily and they report no climate transition → likely warm climate
  if (assessment.skin_type === 'oily') {
    return 'humid_tropical'
  }

  // If skin type is dry and they report no climate transition → likely dry or cold
  if (assessment.skin_type === 'dry') {
    return 'temperate_maritime'
  }

  // Absolute last resort — neutral fallback (NOT tropical)
  return 'temperate_maritime'
}

// ─────────────────────────────────────────────────────────────────
// PART 4: THE MAIN EXPORTED FUNCTION
// Replace the current resolveClimateZone() or equivalent
// ─────────────────────────────────────────────────────────────────

export function resolveClimateZone(
  country: string | null | undefined,
  continent?: string | null,
  assessment?: {
    climate_transition_effects?: string[]
    years_in_current_location?: string
    skin_type?: string
  }
): ClimateZone {

  // Priority 1: Exact country match
  if (country) {
    const normalised = country.trim()
    const direct = COUNTRY_CLIMATE_MAP[normalised]
    if (direct) return direct

    // Try case-insensitive match
    const lower = normalised.toLowerCase()
    const caseMatch = Object.entries(COUNTRY_CLIMATE_MAP).find(
      ([k]) => k.toLowerCase() === lower
    )
    if (caseMatch) return caseMatch[1]
  }

  // Priority 2: Continent fallback
  if (continent) {
    const continentFallback = CONTINENT_CLIMATE_FALLBACK[continent]
    if (continentFallback) return continentFallback
  }

  // Priority 3: Infer from assessment answers
  if (assessment) {
    return inferClimateFromAssessment(assessment)
  }

  // Priority 4: Absolute last resort — temperate_maritime
  // This is NEVER tropical. An unknown location should not get a tropical formula.
  return 'temperate_maritime'
}
