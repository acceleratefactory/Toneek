// src/lib/dispatch/canDispatch.ts
// Gating function — called before every dispatch trigger in Sprint 5.
// Returns { can_dispatch: true } or { can_dispatch: false, reason: string }.
//
// Rules:
//   Order 1 → always dispatches, no check-in required.
//   Order 2 → requires Week 4 check-in.
//   Order 3+ → requires Week 8 check-in.
//
// If blocked: marks order as held and notifies customer via WhatsApp.

import { adminClient } from '@/lib/supabase/admin'

export interface DispatchResult {
    can_dispatch: boolean
    reason?: string
}

export async function canDispatchNextOrder(
    user_id: string,
    order_number: number
): Promise<DispatchResult> {

    // Order 1 always dispatches
    if (order_number === 1) {
        return { can_dispatch: true }
    }

    // Order 2 requires Week 4 check-in
    if (order_number === 2) {
        const { data: week4 } = await adminClient
            .from('skin_outcomes')
            .select('id')
            .eq('user_id', user_id)
            .eq('check_in_week', 4)
            .maybeSingle()

        if (!week4) {
            await holdOrder(user_id, 'week4_checkin_required')
            return { can_dispatch: false, reason: 'week4_checkin_required' }
        }
    }

    // Order 3+ requires Week 8 check-in
    if (order_number >= 3) {
        const { data: week8 } = await adminClient
            .from('skin_outcomes')
            .select('id')
            .eq('user_id', user_id)
            .eq('check_in_week', 8)
            .maybeSingle()

        if (!week8) {
            await holdOrder(user_id, 'week8_checkin_required')
            return { can_dispatch: false, reason: 'week8_checkin_required' }
        }
    }

    return { can_dispatch: true }
}

// ─── Hold order + notify customer ────────────────────────────────────────────

async function holdOrder(user_id: string, reason: string) {
    // Mark orders in production queue as held
    // 'pending_production' and 'in_production' are the valid status values
    await adminClient
        .from('orders')
        .update({
            status:               'pending_dispatch',
            dispatch_held_reason: reason,
        })
        .eq('user_id', user_id)
        .in('status', ['pending_production', 'in_production'])

    // Get customer phone for WhatsApp notification
    const { data: profile } = await adminClient
        .from('profiles')
        .select('phone, email, full_name')
        .eq('id', user_id)
        .maybeSingle()

    const MESSAGES: Record<string, string> = {
        week4_checkin_required:
            'Your next Toneek formula is ready but we need your Week 4 check-in first. ' +
            'Reply 1–5 to let us know how your skin is doing, or visit your dashboard.',
        week8_checkin_required:
            'Your next Toneek formula is ready but we need your Week 8 check-in first. ' +
            'Reply 1–5 to let us know how your skin is doing, or visit your dashboard.',
    }

    const message = MESSAGES[reason]

    if (profile?.phone) {
        await sendWhatsApp(profile.phone, message)
    }

    // Fallback — email if no phone
    if (!profile?.phone && profile?.email) {
        await sendHoldEmail(profile.email, profile.full_name ?? 'there', reason)
    }

    console.log(`[Dispatch] Order held for user ${user_id} — reason: ${reason}`)
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
        console.error('[Dispatch WhatsApp failed]', err)
    }
}

async function sendHoldEmail(email: string, name: string, reason: string) {
    const week = reason === 'week4_checkin_required' ? 4 : 8
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://toneek.vercel.app'

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from   = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

        await resend.emails.send({
            from,
            to: email,
            subject: `Action needed: complete your Week ${week} check-in to receive your next order`,
            html: `
                <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                    <h2 style="margin:0 0 16px;">Your next order is ready</h2>
                    <p style="color:#374151;">Hi ${name},</p>
                    <p style="color:#374151;margin-bottom:16px;">
                        Your next Toneek formula is queued for dispatch, but we need your
                        Week ${week} check-in before we can send it.
                    </p>
                    <div style="background:#fff7ed;border-left:4px solid #f97316;padding:12px 16px;border-radius:4px;margin-bottom:24px;">
                        <strong>Your order is on hold</strong> until your check-in is received.
                    </div>
                    <a href="${base}/dashboard/checkin?week=${week}"
                       style="display:inline-block;background:#1a1a1a;color:white;
                              padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                        Complete Week ${week} check-in →
                    </a>
                </div>
            `,
        })
    } catch (err) {
        console.error('[Dispatch hold email failed]', err)
    }
}
