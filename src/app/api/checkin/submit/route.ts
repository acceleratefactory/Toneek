// src/app/api/checkin/submit/route.ts
// Handles dashboard check-in form submission.
// Writes to skin_outcomes, releases held orders, triggers Week 8 score recalculation.

import { createServerClient } from '@supabase/ssr'
import { adminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { calculateSkinScores } from '@/lib/analysis/calculateSkinScores'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
                },
            }
        )

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const {
            week, score,
            adverse_reactions, adverse_detail,
            changes_since_last, moved_city, new_city, new_country,
            photo_url,
        } = await request.json()

        if (!week || !score) {
            return NextResponse.json({ error: 'Missing week or score' }, { status: 400 })
        }

        // Idempotency — check if already submitted
        const { data: existing } = await adminClient
            .from('skin_outcomes')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('check_in_week', week)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: 'Check-in already recorded for this week' }, { status: 409 })
        }

        const improvement_score = score * 2 // convert 1–5 → 2–10

        // Write to skin_outcomes
        const { error: insertError } = await adminClient.from('skin_outcomes').insert({
            user_id:              session.user.id,
            check_in_week:        week,
            improvement_score,
            adverse_reactions:    adverse_reactions ?? false,
            adverse_detail:       adverse_detail ?? null,
            photo_url:            photo_url ?? null,
            check_in_channel:     'dashboard',
            recorded_at:          new Date().toISOString(),
            anything_changed:     changes_since_last?.length > 0 && !changes_since_last.includes('nothing_significant'),
            change_detail:        changes_since_last?.filter((c: string) => c !== 'nothing_significant').join(', ') || null,
        })

        if (insertError) {
            console.error('Outcome insert error:', insertError)
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        // Update profile location if they moved
        if (moved_city && new_city && new_country) {
            await adminClient
                .from('profiles')
                .update({ city: new_city.trim(), country: new_country.trim() })
                .eq('id', session.user.id)
        }

        // Update prediction log (Week 4 or 8)
        if (week === 4 || week === 8) {
            await updatePredictionLog(session.user.id, week, improvement_score)
        }

        // Release held order (Week 4 or 8)
        let order_released = false
        if (week === 4 || week === 8) {
            order_released = await releaseHeldOrder(session.user.id, week)
        }

        // Recalculate Skin OS Score at Week 8
        let new_skin_os_score: number | null = null
        if (week === 8) {
            const { recalculateSkinOSScore } = await import('@/lib/scores/recalculateSkinOSScore')
            new_skin_os_score = await recalculateSkinOSScore(session.user.id, improvement_score)

            // Store updated score back on the outcome record
            if (new_skin_os_score) {
                await adminClient
                    .from('skin_outcomes')
                    .update({ new_skin_os_score })
                    .eq('user_id', session.user.id)
                    .eq('check_in_week', 8)
            }
        }

        // Recalculate the 8 analysis scores and update on the assessment record
        try {
            const { data: assessmentRow } = await adminClient
                .from('skin_assessments')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (assessmentRow) {
                const updatedScores = calculateSkinScores(assessmentRow)
                await adminClient
                    .from('skin_assessments')
                    .update({ analysis_scores: updatedScores })
                    .eq('id', assessmentRow.id)
            }
        } catch (scoreErr) {
            // Non-fatal — scores will update on the next check-in if this fails
            console.error('Analysis score recalculation failed (non-fatal):', scoreErr)
        }

        return NextResponse.json({
            success:           true,
            week,
            improvement_score,
            order_released,
            new_skin_os_score,
        })

    } catch (err: any) {
        console.error('Checkin submit error:', err)
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function updatePredictionLog(user_id: string, week: number, score: number) {
    const field = week === 4 ? 'actual_week4_score' : 'actual_week8_score'

    const { data: log } = await adminClient
        .from('prediction_log')
        .select('id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (log) {
        await adminClient.from('prediction_log').update({ [field]: score }).eq('id', log.id)
    }
}

async function releaseHeldOrder(user_id: string, week: number): Promise<boolean> {
    const held_reason   = week === 4 ? 'week4_checkin_required' : 'week8_checkin_required'
    const checkin_field = week === 4 ? 'week4_checkin_completed' : 'week8_checkin_completed'

    const { data } = await adminClient
        .from('orders')
        .update({
            [checkin_field]:      true,
            dispatch_held_reason: null,
            status:               'pending_dispatch',
        })
        .eq('user_id', user_id)
        .eq('dispatch_held_reason', held_reason)
        .select('id')

    return Array.isArray(data) && data.length > 0
}
