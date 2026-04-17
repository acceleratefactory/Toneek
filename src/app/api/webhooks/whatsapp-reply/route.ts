// src/app/api/webhooks/whatsapp-reply/route.ts
// Handles when a customer replies 1–5 to the WhatsApp check-in message.
// Records the outcome, releases held orders at Week 4 and 8.
// Structure varies by WhatsApp provider — parse logic is provider-agnostic.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Parse incoming WhatsApp message — adapt field names to your provider
        const phone        = (body.from ?? body.phone ?? '').toString().trim()
        const message_text = (body.text ?? body.body ?? body.message ?? '').toString().trim()

        if (!phone) return NextResponse.json({ received: true })

        // Validate score: must be 1–5
        const score = parseInt(message_text)
        if (isNaN(score) || score < 1 || score > 5) {
            return NextResponse.json({ received: true })
        }

        // Look up user by phone
        const { data: profile } = await adminClient
            .from('profiles')
            .select('id, full_name')
            .eq('phone', phone)
            .maybeSingle()

        if (!profile) return NextResponse.json({ received: true })

        // Get active subscription to determine days active
        const { data: subscription } = await adminClient
            .from('subscriptions')
            .select('started_at')
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle()

        if (!subscription) return NextResponse.json({ received: true })

        const daysActive = Math.floor(
            (Date.now() - new Date(subscription.started_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        // Map days to check-in week
        let week: number
        if (daysActive <= 21)      week = 2
        else if (daysActive <= 42) week = 4
        else                       week = 8

        // Idempotency — don't double-record
        const { data: existing } = await adminClient
            .from('skin_outcomes')
            .select('id')
            .eq('user_id', profile.id)
            .eq('check_in_week', week)
            .maybeSingle()

        if (existing) {
            await sendWhatsApp(phone, `Already recorded your Week ${week} check-in. Thank you.`)
            return NextResponse.json({ received: true })
        }

        // Convert 1–5 to 2–10 scale
        const improvement_score = score * 2

        // Record outcome
        await adminClient.from('skin_outcomes').insert({
            user_id:           profile.id,
            check_in_week:     week,
            improvement_score,
            check_in_channel:  'whatsapp',
            recorded_at:       new Date().toISOString(),
        })

        // Update prediction log (Week 4 or 8 only)
        if (week === 4 || week === 8) {
            await updatePredictionLog(profile.id, week, improvement_score)
        }

        // Release held order for Week 4 or 8
        if (week === 4 || week === 8) {
            await releaseHeldOrder(profile.id, week)
        }

        // Trigger Skin OS Score recalculation at Week 8
        if (week === 8) {
            const { recalculateSkinOSScore } = await import('@/lib/scores/recalculateSkinOSScore')
            await recalculateSkinOSScore(profile.id, improvement_score)
        }

        // Confirmation message
        const RESPONSES: Record<number, string> = {
            2:  `Got it. Week ${week} logged. Keep going — early days.`,
            4:  `Got it. Week ${week} logged — some change beginning. Stay consistent.`,
            6:  `Solid. Week ${week} logged — noticeable progress. Formula is working.`,
            8:  `Strong result. Week ${week} logged — your skin is responding well.`,
            10: `Excellent. Week ${week} logged — dramatic improvement. This is the data we need.`,
        }

        const name = profile.full_name?.split(' ')[0] ?? 'there'
        const response = RESPONSES[improvement_score] ?? `Got it. Week ${week} logged.`
        const extra = (week === 4 || week === 8)
            ? `\n\nYour next order has been queued for dispatch.`
            : ''

        await sendWhatsApp(phone, `${name}, ${response}${extra}`)

        return NextResponse.json({ received: true, week, improvement_score })

    } catch (err: any) {
        console.error('[WhatsApp webhook] Error:', err)
        return NextResponse.json({ received: true }) // always return 200 to provider
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function updatePredictionLog(user_id: string, week: number, score: number) {
    const field = week === 4 ? 'actual_week4_score' : 'actual_week8_score'

    // Get the most recent prediction_log entry for this user
    const { data: log } = await adminClient
        .from('prediction_log')
        .select('id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (log) {
        await adminClient
            .from('prediction_log')
            .update({ [field]: score })
            .eq('id', log.id)
    }
}

async function releaseHeldOrder(user_id: string, week: number) {
    const held_reason   = week === 4 ? 'week4_checkin_required' : 'week8_checkin_required'
    const checkin_field = week === 4 ? 'week4_checkin_completed' : 'week8_checkin_completed'

    await adminClient
        .from('orders')
        .update({
            [checkin_field]:      true,
            dispatch_held_reason: null,
            status:               'pending_dispatch',
        })
        .eq('user_id', user_id)
        .eq('dispatch_held_reason', held_reason)
}

async function sendWhatsApp(phone: string, message: string) {
    const apiUrl = process.env.WHATSAPP_API_URL
    const apiKey = process.env.WHATSAPP_API_TOKEN

    if (!apiUrl) {
        console.log(`[WhatsApp → ${phone}]`, message)
        return
    }
    try {
        await fetch(`${apiUrl}?phone=${encodeURIComponent(phone)}&apikey=${apiKey}&text=${encodeURIComponent(message)}`)
    } catch (err) {
        console.error('[WhatsApp reply send failed]', err)
    }
}
