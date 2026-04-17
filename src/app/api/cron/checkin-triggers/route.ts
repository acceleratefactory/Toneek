// src/app/api/cron/checkin-triggers/route.ts
// Runs daily at 8:00 UTC (9:00 WAT) via Vercel cron.
// Triggers check-in prompts at Day 14, 28, 56.
// Sends 48-hour reminders at Day 16, 30, 58.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    // Security — only Vercel cron should call this
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active subscriptions with profile contact details
    const { data: subscriptions, error } = await adminClient
        .from('subscriptions')
        .select('id, user_id, started_at, profiles!user_id(email, full_name, phone)')
        .eq('status', 'active')

    if (error || !subscriptions) {
        console.error('[Cron checkin] Query error:', error)
        return NextResponse.json({ error: error?.message ?? 'Query failed' }, { status: 500 })
    }

    let triggered = 0
    const now = new Date()

    for (const sub of subscriptions) {
        const profile   = (sub as any).profiles
        const startedAt = new Date(sub.started_at)
        const daysActive = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24))

        // ── Initial prompts ──────────────────────────────────────────────────
        if (daysActive === 14) {
            const existing = await getCheckin(sub.user_id, 2)
            if (!existing) { await sendCheckinPrompt(profile, 2); triggered++ }
        }
        if (daysActive === 28) {
            const existing = await getCheckin(sub.user_id, 4)
            if (!existing) { await sendCheckinPrompt(profile, 4); triggered++ }
        }
        if (daysActive === 56) {
            const existing = await getCheckin(sub.user_id, 8)
            if (!existing) { await sendCheckinPrompt(profile, 8); triggered++ }
        }

        // ── 48-hour reminders ────────────────────────────────────────────────
        if (daysActive === 16) {
            const existing = await getCheckin(sub.user_id, 2)
            if (!existing) { await sendCheckinReminder(profile, 2); triggered++ }
        }
        if (daysActive === 30) {
            const existing = await getCheckin(sub.user_id, 4)
            if (!existing) { await sendCheckinReminder(profile, 4); triggered++ }
        }
        if (daysActive === 58) {
            const existing = await getCheckin(sub.user_id, 8)
            if (!existing) { await sendCheckinReminder(profile, 8); triggered++ }
        }
    }

    console.log(`[Cron checkin] Done — ${triggered} prompt(s) triggered`)
    return NextResponse.json({ triggered, subscriptions_checked: subscriptions.length })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCheckin(user_id: string, week: number) {
    const { data } = await adminClient
        .from('skin_outcomes')
        .select('id')
        .eq('user_id', user_id)
        .eq('check_in_week', week)
        .maybeSingle()
    return data
}

async function sendCheckinPrompt(profile: any, week: number) {
    const name  = profile?.full_name ?? 'there'
    const phone = profile?.phone
    const email = profile?.email
    const base  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://toneek.vercel.app'

    const message =
        `Hi ${name} — it's your Week ${week} Toneek check-in.\n\n` +
        `One question: how is your skin responding?\n\n` +
        `Reply with a number from 1 to 5:\n` +
        `1 = No change at all\n` +
        `2 = Very slight improvement\n` +
        `3 = Noticeable improvement\n` +
        `4 = Significant improvement\n` +
        `5 = Dramatic improvement\n\n` +
        `Or complete it here: ${base}/dashboard/checkin?week=${week}`

    if (phone)  await sendWhatsApp(phone, message)
    if (email)  await sendCheckinEmail(email, name, week, false)
}

async function sendCheckinReminder(profile: any, week: number) {
    const name   = profile?.full_name ?? 'there'
    const phone  = profile?.phone
    const email  = profile?.email
    const isGateWeek = week === 4 || week === 8

    const message =
        `${name}, your Week ${week} check-in is still needed.\n\n` +
        (isGateWeek ? `Your next formula shipment is on hold until we hear from you.\n\n` : '') +
        `Just reply 1–5 to let us know how your skin is doing.`

    if (phone)  await sendWhatsApp(phone, message)
    if (email)  await sendCheckinEmail(email, name, week, isGateWeek)
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
        console.error('[WhatsApp send failed]', err)
    }
}

async function sendCheckinEmail(email: string, name: string, week: number, isGateWeek: boolean) {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://toneek.vercel.app'
    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from   = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

        await resend.emails.send({
            from,
            to: email,
            subject: `Your Week ${week} Toneek check-in`,
            html: `
                <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                    <h2 style="margin:0 0 16px;">Week ${week} — How's your skin?</h2>
                    <p style="color:#374151;">Hi ${name},</p>
                    <p style="color:#374151;margin-bottom:24px;">
                        It's time for your Week ${week} skin check-in.
                        This takes 2 minutes and helps us track your progress
                        and keep your formula working for your skin.
                    </p>
                    ${isGateWeek ? `
                        <div style="background:#fff7ed;border-left:4px solid #f97316;padding:12px 16px;border-radius:4px;margin-bottom:24px;">
                            <strong>Note:</strong> Your next order will be held until we receive your check-in.
                        </div>` : ''}
                    <a href="${base}/dashboard/checkin?week=${week}"
                       style="display:inline-block;background:#1a1a1a;color:white;
                              padding:14px 28px;border-radius:8px;text-decoration:none;
                              font-weight:600;">
                        Complete Week ${week} check-in →
                    </a>
                </div>
            `,
        })
    } catch (err) {
        console.error('[Checkin email failed]', err)
    }
}
