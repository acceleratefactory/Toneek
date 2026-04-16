// src/lib/climate.ts
// Resolves climate zone from city + country using the city_climate_map table.
// Falls back to country-level default when city is not in the map.

export async function resolveClimateZone(
    city: string,
    country: string,
    supabase: any
): Promise<string | null> {
    const { data } = await supabase
        .from('city_climate_map')
        .select('climate_zone')
        .ilike('city', city.trim())
        .ilike('country', country.trim())
        .single()

    return data?.climate_zone ?? getCountryDefaultClimate(country)
}

// Country-level fallback when city is not in city_climate_map
export function getCountryDefaultClimate(country: string): string {
    const COUNTRY_CLIMATE: Record<string, string> = {
        'Nigeria': 'humid_tropical',
        'Ghana': 'humid_tropical',
        'Ivory Coast': 'humid_tropical',
        'Cote dIvoire': 'humid_tropical',
        'Cameroon': 'equatorial',
        'Uganda': 'humid_tropical',
        'Tanzania': 'equatorial',
        'DR Congo': 'equatorial',
        'Sierra Leone': 'equatorial',
        'Senegal': 'semi_arid',
        'Kenya': 'semi_arid',
        'South Africa': 'semi_arid',
        'Nairobi': 'semi_arid',
        'United Kingdom': 'temperate_maritime',
        'Ireland': 'temperate_maritime',
        'Netherlands': 'temperate_maritime',
        'France': 'temperate_maritime',
        'Belgium': 'temperate_maritime',
        'Germany': 'cold_continental',
        'Sweden': 'cold_continental',
        'Norway': 'cold_continental',
        'Denmark': 'cold_continental',
        'United States': 'cold_continental',
        'Canada': 'cold_continental',
        'Jamaica': 'humid_tropical',
        'Trinidad and Tobago': 'humid_tropical',
        'Barbados': 'humid_tropical',
        'Australia': 'mediterranean',
        'United Arab Emirates': 'semi_arid',
        'Saudi Arabia': 'semi_arid',
    }
    return COUNTRY_CLIMATE[country] ?? 'humid_tropical'
}
