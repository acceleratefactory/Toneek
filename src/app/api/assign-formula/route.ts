import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// System config — cold start mode
const SYSTEM_CONFIG = {
    cold_start_mode: process.env.COLD_START_MODE === 'true',
    cold_start_threshold: parseInt(process.env.COLD_START_THRESHOLD || '200'),
}

// Salicylic Acid-containing formula codes — excluded when isotretinoin_flag is true
const SA_CONTAINING = ['LG-OA-01', 'AB-OA-01', 'LG-OH-01', 'GN-OT-01', 'M-OA-01']

// SA-free substitutes (chemist-approved safe alternatives)
const SA_FREE_MAP: Record<string, string> = {
    'LG-OA-01': 'LG-OB-01',
    'AB-OA-01': 'AB-OB-01',
    'LG-OH-01': 'GN-SN-01',
    'GN-OT-01': 'GN-NT-01',
    'M-OA-01': 'M-OB-01',
}

// Concentration reference — chemist final position (April 2026)
// These match what is stored in formula_codes.active_modules
// SA globally 1.5% | AzA 8% in LG-OA-01 only | all others unchanged
export const FORMULA_CONCENTRATIONS: Record<string, Record<string, string>> = {
    'LG-OA-01': { niacinamide: '10%', salicylic_acid: '1.5%', azelaic_acid: '8%' },
    'LG-OB-01': { niacinamide: '10%', azelaic_acid: '15%', kojic_acid: '2%' },
    'LG-CA-01': { niacinamide: '5%', salicylic_acid: '1.5%', azelaic_acid: '10%' },
    'LG-CB-01': { niacinamide: '10%', tranexamic_acid: '3%', azelaic_acid: '10%' },
    'LG-DB-01': { niacinamide: '5%', tranexamic_acid: '5%', bakuchiol: '1%' },
    'LG-DH-01': { centella_asiatica: 'complex', niacinamide: '5%', bakuchiol: '1%' },
    'LG-OH-01': { niacinamide: '10%', salicylic_acid: '1.5%' },
    'AB-OA-01': { niacinamide: '10%', salicylic_acid: '1.5%', azelaic_acid: '10%' },
    'AB-OB-01': { niacinamide: '10%', azelaic_acid: '15%', tranexamic_acid: '3%' },
    'AB-DB-01': { niacinamide: '5%', tranexamic_acid: '5%', centella_asiatica: 'complex' },
    'AB-DH-01': { centella_asiatica: 'complex', niacinamide: '5%', bakuchiol: '2%' },
    'GN-CA-01': { niacinamide: '5%', salicylic_acid: '1.5%', azelaic_acid: '10%' },
    'GN-CB-01': { niacinamide: '10%', tranexamic_acid: '3%', kojic_acid: '1%' },
    'GN-NB-01': { niacinamide: '10%', tranexamic_acid: '5%', ascorbyl_glucoside: '2%' },
    'GN-NT-01': { niacinamide: '5%', bakuchiol: '2%', azelaic_acid: '10%' },
    'GN-DH-01': { centella_asiatica: 'complex', niacinamide: '5%', bakuchiol: '1%' },
    'GN-OT-01': { niacinamide: '10%', salicylic_acid: '1.5%', azelaic_acid: '10%' },
    'GN-AG-01': { bakuchiol: '2%', niacinamide: '10%', peptide_blend: 'complex' },
    'GN-SN-01': { centella_asiatica: 'complex', niacinamide: '5%' },
    'RP-HT-01': { centella_asiatica: '3%', niacinamide: '5%' },
    'RP-HT-02': { centella_asiatica: '2%', niacinamide: '5%', tranexamic_acid: '3%' },
    'RP-HT-03': { niacinamide: '10%', tranexamic_acid: '5%', bakuchiol: '1%' },
    'RP-SA-01': { centella_asiatica: '3%', niacinamide: '5%' },
    'RP-SA-02': { centella_asiatica: '2%', niacinamide: '5%', tranexamic_acid: '3%' },
    'RP-SA-03': { niacinamide: '10%', tranexamic_acid: '5%', bakuchiol: '2%' },
    'PG-GN-01': { niacinamide: '5%', tranexamic_acid: '3%', centella_asiatica: 'complex' },
    'PG-DH-01': { centella_asiatica: 'complex', niacinamide: '5%' },
    'M-OA-01': { niacinamide: '10%', azelaic_acid: '15%', salicylic_acid: '1.5%' },
    'M-OB-01': { niacinamide: '10%', tranexamic_acid: '3%', azelaic_acid: '10%' },
    'M-CA-01': { niacinamide: '5%', salicylic_acid: '1.5%', azelaic_acid: '10%' },
}

export async function POST(request: NextRequest) {
    const assessment = await request.json()

    // Handle formula_override from trigger modifiers (e.g. barrier overload)
    if (assessment.formula_override) {
        const { data: formula } = await adminClient
            .from('formula_codes')
            .select('*')
            .eq('formula_code', assessment.formula_override)
            .single()

        return NextResponse.json({
            formula_code: assessment.formula_override,
            formula,
            confidence_score: 0.5,
            risk_score: calculateRiskScore(assessment),
            routing: 'autonomous',
            monitoring_mode: false,
            checkin_frequency: 'standard',
            override_reason: 'barrier_overload_detected',
            skin_os_score: calculateSkinOSScore(assessment),
            profile_segment: buildProfileSegment(assessment),
            formula_tier: 'conservative',
        })
    }

    // Step 1: Calculate confidence score
    const confidence_score = calculateConfidenceScore(assessment)

    // Step 2: Calculate risk score
    const risk_score = calculateRiskScore(assessment)

    // Step 3: Apply risk routing
    const routing = applyRiskRouting(risk_score)

    // Step 4: Assign formula
    let formula_code = assignFormula(assessment, routing, confidence_score)

    // Step 5: Isotretinoin SA exclusion — swap formula if SA-containing
    if (assessment.isotretinoin_flag && SA_CONTAINING.includes(formula_code)) {
        formula_code = SA_FREE_MAP[formula_code] ?? 'GN-SN-01'
    }

    // Step 6: Fetch formula details from DB
    const { data: formula } = await adminClient
        .from('formula_codes')
        .select('*')
        .eq('formula_code', formula_code)
        .single()

    // Step 7: Calculate Skin OS Score
    const skin_os_score = calculateSkinOSScore(assessment)

    // Step 8: Build profile segment
    const profile_segment = buildProfileSegment(assessment)

    // Step 9: Determine formula tier
    const formula_tier =
        confidence_score >= 0.7 ? 'optimised' :
            confidence_score >= 0.4 ? 'standard' : 'conservative'

    // Step 10: Log to rule_performance
    await logRulePerformance(formula_code)

    return NextResponse.json({
        formula_code,
        formula,
        confidence_score,
        risk_score,
        routing: routing.routing,
        monitoring_mode: routing.monitoring_mode,
        checkin_frequency: routing.checkin_frequency,
        skin_os_score,
        profile_segment,
        formula_tier,
    })
}

// ─── Confidence Score ─────────────────────────────────────────────────────────

function calculateConfidenceScore(assessment: any): number {
    let score = 0.5
    if (assessment.intake_photo_url) score += 0.10
    if (assessment.all_steps_complete) score += 0.10
    if (assessment.city_of_residence && assessment.country_of_residence) score += 0.05
    if (!assessment.contradictory_inputs) score += 0.10
    if (assessment.climate_zone) score += 0.05
    if (assessment.pregnant_or_breastfeeding || assessment.hormonal_contraception) score -= 0.05
    if (assessment.bleaching_history === 'active') score -= 0.10
    return Math.min(Math.max(score, 0.1), 1.0)
}

// ─── Risk Score ───────────────────────────────────────────────────────────────

function calculateRiskScore(assessment: any): number {
    let risk = 0.0

    // Bleaching history
    if (assessment.bleaching_history === 'active') risk += 0.30
    else if (assessment.bleaching_history === 'recent_12mo') risk += 0.20
    else if (assessment.bleaching_history === 'historical') risk += 0.05

    // Barrier integrity signals
    if (assessment.bleaching_cessation_effects?.includes('barrier_sensitive')) risk += 0.15
    if (assessment.bleaching_cessation_effects?.includes('rebound_darkening')) risk += 0.10

    // Hormonal / pregnancy risk
    if (assessment.pregnant_or_breastfeeding) risk += 0.20
    if (assessment.hormonal_contraception && assessment.primary_concern === 'PIH') risk += 0.10

    // Medications
    if (assessment.medications_risk_high) risk += 0.10

    // Concern complexity
    if ((assessment.secondary_concerns?.length ?? 0) >= 3) risk += 0.10

    // Data quality inverse contribution
    const data_risk = 1.0 - calculateConfidenceScore(assessment)
    risk += data_risk * 0.15

    return Math.min(risk, 1.0)
}

// ─── Risk Routing ─────────────────────────────────────────────────────────────

function applyRiskRouting(risk_score: number) {
    if (risk_score <= 0.25) return {
        routing: 'autonomous', monitoring_mode: false, checkin_frequency: 'standard',
    }
    if (risk_score <= 0.50) return {
        routing: 'autonomous_monitored', monitoring_mode: true, checkin_frequency: 'elevated',
    }
    if (risk_score <= 0.75) return {
        routing: 'system_override_safe', monitoring_mode: true, checkin_frequency: 'elevated',
    }
    return {
        routing: 'dermatology_bridge_recommended', monitoring_mode: true, checkin_frequency: 'weekly',
    }
}

// ─── Formula Assignment ───────────────────────────────────────────────────────

function assignFormula(assessment: any, routing: any, confidence_score: number): string {
    const {
        climate_zone, skin_type, primary_concern, bleaching_history,
        pregnant_or_breastfeeding, years_in_current_location,
        climate_transition_effects, gender,
    } = assessment

    // Priority 1 — Pregnancy safe
    if (pregnant_or_breastfeeding) {
        return skin_type === 'dry' ? 'PG-DH-01' : 'PG-GN-01'
    }

    // Priority 2 — Restoration protocol
    if (bleaching_history === 'active' || bleaching_history === 'recent_12mo') {
        if (routing.routing === 'system_override_safe' || bleaching_history === 'active') {
            return climate_zone === 'semi_arid' ? 'RP-SA-01' : 'RP-HT-01'
        }
    }

    // Priority 3 — Climate transition (diaspora newly relocated)
    if (
        years_in_current_location === 'less_than_1' &&
        (climate_transition_effects?.includes('more_dry') ||
            climate_transition_effects?.includes('more_sensitive'))
    ) {
        return 'RP-HT-01'
    }

    // Priority 4 — Male protocols
    if (gender === 'male') {
        if (primary_concern === 'razor_bumps') return 'M-OA-01'
        if (primary_concern === 'PIH') return 'M-OB-01'
        if (primary_concern === 'acne') return 'M-CA-01'
    }

    // Priority 5 — Sensitive skin
    if (skin_type === 'sensitive') return 'GN-SN-01'

    // Priority 6 — Ageing
    if (primary_concern === 'ageing') return 'GN-AG-01'

    // Main matrix — climate + skin type + concern
    const zone = climate_zone || 'general'

    if (zone === 'humid_tropical') {
        if (skin_type === 'oily') {
            if (primary_concern === 'acne') return 'LG-OA-01'
            if (primary_concern === 'PIH') return 'LG-OB-01'
            if (primary_concern === 'oiliness') return 'LG-OH-01'
            return 'LG-OA-01'
        }
        if (skin_type === 'combination') {
            if (primary_concern === 'acne') return 'LG-CA-01'
            if (primary_concern === 'PIH') return 'LG-CB-01'
            return 'LG-CA-01'
        }
        if (skin_type === 'dry') {
            if (primary_concern === 'PIH') return 'LG-DB-01'
            return 'LG-DH-01'
        }
        if (skin_type === 'normal') {
            if (primary_concern === 'PIH') return 'LG-CB-01'
            return 'GN-NT-01'
        }
    }

    if (zone === 'semi_arid') {
        if (skin_type === 'oily') {
            if (primary_concern === 'acne') return 'AB-OA-01'
            if (primary_concern === 'PIH') return 'AB-OB-01'
            return 'AB-OA-01'
        }
        if (skin_type === 'dry') {
            if (primary_concern === 'PIH') return 'AB-DB-01'
            return 'AB-DH-01'
        }
        if (skin_type === 'combination') {
            if (primary_concern === 'PIH') return 'GN-CB-01'
            return 'GN-CA-01'
        }
    }

    if (zone === 'temperate_maritime' || zone === 'cold_continental') {
        if (skin_type === 'oily' || skin_type === 'combination') {
            if (primary_concern === 'PIH') return 'GN-CB-01'
            if (primary_concern === 'acne') return 'GN-CA-01'
            return 'GN-CB-01'
        }
        if (skin_type === 'dry' || skin_type === 'normal') {
            if (primary_concern === 'PIH') return 'GN-NB-01'
            return 'GN-DH-01'
        }
    }

    // General fallbacks (mediterranean, equatorial, unknown)
    if (primary_concern === 'PIH') {
        if (skin_type === 'oily' || skin_type === 'combination') return 'GN-CB-01'
        return 'GN-NB-01'
    }
    if (primary_concern === 'acne') {
        if (skin_type === 'oily') return 'LG-OA-01'
        return 'GN-CA-01'
    }
    if (primary_concern === 'dryness') return 'GN-DH-01'
    if (primary_concern === 'texture') return 'GN-NT-01'
    if (primary_concern === 'oiliness') return 'LG-OH-01'

    return 'GN-SN-01'
}

// ─── Skin OS Score ────────────────────────────────────────────────────────────

function calculateSkinOSScore(assessment: any): number {
    let score = 100

    const concern_deductions: Record<string, number> = {
        PIH: 15, acne: 20, dryness: 10, oiliness: 8,
        texture: 8, sensitivity: 10, razor_bumps: 15, ageing: 5,
    }

    if (assessment.primary_concern) {
        score -= concern_deductions[assessment.primary_concern] ?? 10
    }
    if (assessment.secondary_concerns) {
        score -= Math.min(assessment.secondary_concerns.length * 5, 15)
    }
    if (assessment.bleaching_history === 'active') score -= 20
    if (assessment.bleaching_history === 'recent_12mo') score -= 15
    if (assessment.bleaching_history === 'historical') score -= 5
    if (assessment.bleaching_cessation_effects?.includes('barrier_sensitive')) score -= 10
    if (assessment.bleaching_cessation_effects?.includes('rebound_darkening')) score -= 5
    if (assessment.climate_zone === 'humid_tropical' && assessment.skin_type === 'oily') score -= 5

    return Math.max(score, 20)
}

// ─── Profile Segment ──────────────────────────────────────────────────────────

function buildProfileSegment(assessment: any): string {
    return [
        assessment.climate_zone || 'unknown',
        assessment.skin_type || 'unknown',
        assessment.primary_concern || 'unknown',
        assessment.bleaching_history || 'none',
    ].join('_')
}

// ─── Rule Performance Logging ─────────────────────────────────────────────────

async function logRulePerformance(formula_code: string) {
    const rule_id = `assign_${formula_code}`
    await adminClient.from('rule_performance').upsert(
        {
            rule_id,
            rule_description: `Assigns formula ${formula_code}`,
            total_applications: 1,
            last_applied_at: new Date().toISOString(),
        },
        { onConflict: 'rule_id', ignoreDuplicates: false }
    )
}
