// src/app/api/assessments/submit/route.ts
// The full assessment submission pipeline.
// Called by Step 10 on "Get my formula" click.

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { applyTriggerModifiers } from '@/lib/formula/triggerModifiers'
import { resolveCurrency } from '@/lib/currency'
import { sendFormulaEmail } from '@/lib/email/sendFormulaEmail'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
    const assessment = await request.json()

    // Step 1: Apply trigger modifiers before calling rule engine
    const modified = applyTriggerModifiers(assessment)

    // Step 2: Call rule engine
    const formulaRes = await fetch(`${BASE_URL}/api/assign-formula`, {
        method: 'POST',
        body: JSON.stringify(modified),
        headers: { 'Content-Type': 'application/json' },
    })
    const formulaResult = await formulaRes.json()

    // Step 3: Create / link user account via OTP (magic link)
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.signInWithOtp({
        email: assessment.email,
        options: { shouldCreateUser: true },
    })

    // Step 4: Write full assessment to DB using admin client (bypasses RLS)
    const { data: assessmentRecord, error: insertError } = await adminClient
        .from('skin_assessments')
        .insert({
            user_id: null, // linked after magic link click

            // Location
            country_of_residence: assessment.country_of_residence,
            city_of_residence: assessment.city_of_residence,
            climate_zone: assessment.climate_zone,
            years_in_current_location: assessment.years_in_current_location,
            climate_transition_effects: assessment.climate_transition_effects,

            // Concern
            primary_concern: assessment.primary_concern,
            skin_type: assessment.skin_type,
            secondary_concerns: assessment.secondary_concerns,

            // Step 5
            concern_duration: assessment.concern_duration,
            concern_trajectory: assessment.concern_trajectory,

            // Step 6
            triggers: assessment.triggers,

            // Step 7
            bleaching_history: assessment.bleaching_history,
            bleaching_cessation_effects: assessment.bleaching_cessation_effects,

            // Step 8
            pregnant_or_breastfeeding: assessment.pregnant_or_breastfeeding,
            hormonal_contraception: assessment.hormonal_contraception,
            medications: assessment.medications,

            // Step 9
            current_product_count: assessment.current_product_count,
            current_actives: assessment.current_actives,
            routine_expectation: assessment.routine_expectation,

            // Formula assignment
            formula_code: formulaResult.formula_code,
            formula_rationale: formulaResult.formula?.profile_description ?? null,
            active_modules: formulaResult.formula?.active_modules ?? null,
            assigned_at: new Date().toISOString(),

            // Scores
            skin_os_score: formulaResult.skin_os_score,
            confidence_score: formulaResult.confidence_score,
            risk_score: formulaResult.risk_score,
            risk_routing: formulaResult.routing,
            monitoring_mode: !!formulaResult.monitoring_mode && formulaResult.monitoring_mode !== false,
            checkin_frequency: formulaResult.checkin_frequency,
            formula_tier: formulaResult.formula_tier,

            // Flags from trigger modifiers
            barrier_overload_flag: modified.barrier_overload_flag ?? false,
            tranexamic_priority: modified.tranexamic_priority ?? false,
            isotretinoin_flag: assessment.medications?.includes('isotretinoin') ?? false,

            // Profile
            profile_segment: formulaResult.profile_segment,
            is_flagged_for_review: (formulaResult.risk_score ?? 0) > 0.75,

            // Photo
            intake_photo_url: assessment.photo_url && assessment.photo_url !== 'pending_upload'
                ? assessment.photo_url
                : null,
            photo_consent: assessment.photo_consent ?? false,

            // Acquisition
            how_did_you_hear: assessment.how_did_you_hear,
        })
        .select()
        .single()

    if (insertError) {
        console.error('Assessment insert error:', insertError)
        return NextResponse.json({
            success: false,
            error: insertError.message,
        }, { status: 500 })
    }

    // Step 5: Send formula email via Resend
    await sendFormulaEmail({
        email: assessment.email,
        formula_code: formulaResult.formula_code,
        formula: formulaResult.formula,
        skin_os_score: formulaResult.skin_os_score,
        primary_concern: assessment.primary_concern,
        climate_zone: assessment.climate_zone,
        routine_expectation: assessment.routine_expectation,
        isotretinoin_flag: assessment.medications?.includes('isotretinoin') ?? false,
        assessment_id: assessmentRecord?.id,
    })

    return NextResponse.json({
        success: true,
        assessment_id: assessmentRecord?.id ?? null,
        formula_code: formulaResult.formula_code,
        skin_os_score: formulaResult.skin_os_score,
        redirect: '/results',
    })
}
