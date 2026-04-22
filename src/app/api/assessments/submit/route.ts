// src/app/api/assessments/submit/route.ts
// The full assessment submission pipeline.
// Called by Step 10 on "Get my formula" click.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { applyTriggerModifiers } from '@/lib/formula/triggerModifiers'
import { resolveCurrency } from '@/lib/currency'
import { sendFormulaEmail } from '@/lib/email/sendFormulaEmail'

export async function POST(request: NextRequest) {
    const assessment = await request.json()
    const BASE_URL = request.nextUrl.origin

    // Step 1: Apply trigger modifiers before calling rule engine
    const modified = applyTriggerModifiers(assessment)

    // Step 2: Call rule engine
    const formulaRes = await fetch(`${BASE_URL}/api/assign-formula`, {
        method: 'POST',
        body: JSON.stringify(modified),
        headers: { 'Content-Type': 'application/json' },
    })
    const formulaResult = await formulaRes.json()

    // Step 3: Write full assessment to DB using admin client (bypasses RLS)
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

            // Contact Details
            full_name: assessment.full_name ?? null,
            phone: assessment.phone ?? null,
            whatsapp: assessment.whatsapp ?? null,

            // Email — stored for anonymous user lookup before magic link confirmed
            email: assessment.email ? assessment.email.toLowerCase().trim() : null,
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

    // Step 4: Generate magic link + create/link user (no PKCE — uses token_hash flow)
    const confirmUrl = `${BASE_URL}/auth/confirm?next=/dashboard`
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: assessment.email,
        options: { redirectTo: confirmUrl },
    })

    if (linkError) {
        console.warn('Magic link generation failed:', linkError.message)
    }

    // Link assessment to the user Supabase just created/found
    if (linkData?.user?.id && assessmentRecord?.id) {
        await adminClient
            .from('skin_assessments')
            .update({ user_id: linkData.user.id })
            .eq('id', assessmentRecord.id)

        // Force synchronisation of contact details right into the global Profile dynamically
        await adminClient
            .from('profiles')
            .update({ 
                full_name: assessment.full_name,
                phone: assessment.phone,
                whatsapp: assessment.whatsapp
            })
            .eq('id', linkData.user.id)
    }

    // Send magic link email via Resend
    if (linkData?.properties?.action_link) {
        await sendMagicLinkEmail(assessment.email, linkData.properties.action_link)
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

// ─── Magic link email ─────────────────────────────────────────────────────────

async function sendMagicLinkEmail(email: string, action_link: string) {
    const from = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
            from,
            to: email,
            subject: 'Your Toneek dashboard access link',
            html: `
                <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                    <h2 style="margin:0 0 8px;color:#1a1a1a;">Access your Toneek dashboard</h2>
                    <p style="color:#374151;margin-bottom:24px;">
                        Click the link below to access your personalised formula and dashboard.
                        This link expires in 24 hours and can only be used once.
                    </p>
                    <a href="${action_link}"
                       style="display:inline-block;background:#1a1a1a;color:#d4a574;
                              padding:14px 28px;border-radius:8px;text-decoration:none;
                              font-weight:700;font-size:15px;letter-spacing:0.02em;">
                        Open my dashboard &rarr;
                    </a>
                    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
                        If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
            `,
        })
    } catch (err) {
        console.error('Magic link email failed (non-fatal):', err)
    }
}

