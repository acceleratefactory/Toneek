// src/app/api/resolve-climate/route.ts
// Called by Step 1 on city blur to resolve climate zone from city_climate_map.
// Returns { climate_zone: string | null }

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { getCountryDefaultClimate } from '@/lib/climate'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const country = searchParams.get('country')

    if (!city || !country) {
        return NextResponse.json({ climate_zone: null })
    }

    const { data } = await adminClient
        .from('city_climate_map')
        .select('climate_zone')
        .ilike('city', city.trim())
        .ilike('country', country.trim())
        .single()

    if (data?.climate_zone) {
        return NextResponse.json({ climate_zone: data.climate_zone })
    }

    // Country-level fallback
    const fallback = getCountryDefaultClimate(country)
    return NextResponse.json({ climate_zone: fallback, source: 'country_fallback' })
}
