// src/app/api/webhooks/whatsapp-reply/route.ts
// Handles when a customer replies 1–5 to the WhatsApp check-in message.
// Records the outcome, releases held orders at Week 4 and 8.
// Structure varies by WhatsApp provider — parse logic is provider-agnostic.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Parse incoming WhatsApp message — adapt field names to your provider
        const phone        = (body.from ?? body.phone ?? '').toString().trim()
        const message_text = (body.text ?? body.body ?? body.message ?? '').toString().trim()

        if (!phone) return NextResponse.json({ received: true })

        // Check if this is a Dark Period Response (emoji or text)
        const textLower = message_text.toLowerCase()
        let darkResponse: 'happy' | 'neutral' | 'concerned' | null = null

        if (textLower.includes('😊') || textLower.includes('happy')) {
            darkResponse = 'happy'
        } else if (textLower.includes('😐') || textLower.includes('neutral')) {
            darkResponse = 'neutral'
        } else if (textLower.includes('😟') || textLower.includes('concerned')) {
            darkResponse = 'concerned'
        }

        // Validate score: must be 1–5 if it's not a dark response
        const score = parseInt(message_text)
        
        if (!darkResponse && (isNaN(score) || score < 1 || score > 5)) {
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

        // --- DARK PERIOD LOGIC ---
        if (darkResponse) {
            // Determine the nearest day number (1, 3, or 5)
            let dayNumber = 1
            if (daysActive >= 4) dayNumber = 5
            else if (daysActive >= 2) dayNumber = 3

            // Idempotency for dark period
            const { data: existingDark } = await adminClient
                .from('dark_period_responses')
                .select('id')
                .eq('user_id', profile.id)
                .eq('day_number', dayNumber)
                .maybeSingle()

            if (!existingDark) {
                await adminClient.from('dark_period_responses').insert({
                    user_id: profile.id,
                    day_number: dayNumber,
                    response: darkResponse,
                    response_channel: 'whatsapp',
                    admin_alerted: darkResponse === 'concerned'
                })

                // Acknowledge the user
                if (darkResponse === 'concerned') {
                    await sendWhatsApp(phone, `Thank you for letting us know, ${profile.full_name?.split(' ')[0] ?? 'there'}. A clinical chemist will review your profile and reach out shortly.`)
                    
                    // Alert Admin via WhatsApp
                    if (process.env.ADMIN_WHATSAPP_NUMBER) {
                        await sendWhatsApp(process.env.ADMIN_WHATSAPP_NUMBER, `🚨 Dark Period Alert (Day ${dayNumber})\nCustomer: ${profile.full_name}\nPhone: ${phone}\nStatus: Concerned (WhatsApp)`)
                    }
                    
                    // Alert Admin via Email
                    if (process.env.ADMIN_EMAIL && process.env.RESEND_API_KEY) {
                        try {
                            const resend = new Resend(process.env.RESEND_API_KEY)
                            await resend.emails.send({
                                from: process.env.FROM_EMAIL || 'alerts@toneek.com',
                                to: process.env.ADMIN_EMAIL,
                                subject: `🚨 Dark Period Alert (Day ${dayNumber}) - ${profile.full_name}`,
                                html: `
                                    <h2>Early Reaction Alert</h2>
                                    <p><strong>Customer:</strong> ${profile.full_name}</p>
                                    <p><strong>Phone:</strong> ${phone}</p>
                                    <p><strong>Day:</strong> ${dayNumber}</p>
                                    <p><strong>Status:</strong> Concerned (Submitted via WhatsApp reply)</p>
                                    <p>Please review their profile in the admin dashboard and reach out immediately.</p>
                                `
                            })
                        } catch (e) {
                            console.error('Failed to send admin email alert:', e)
                        }
                    }
                } else if (darkResponse === 'happy') {
                    await sendWhatsApp(phone, `Great to hear! Keep following the protocol.`)
                } else {
                    await sendWhatsApp(phone, `Got it. It's early days, keep following the protocol and let us know if anything changes.`)
                }
            }
            return NextResponse.json({ received: true })
        }
        // --- END DARK PERIOD LOGIC ---

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
