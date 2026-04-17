// src/app/api/subscriptions/[id]/cancel/route.ts
// PATCH — sets subscription to 'cancelling' (ends at next billing date).
// Sends exit email with save offer. Only subscription owner can cancel.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { reason } = await request.json()

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
        if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        // Fetch subscription to get billing date for messaging
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('next_billing_date, plan_tier')
            .eq('id', id)
            .eq('user_id', session.user.id)
            .maybeSingle()

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        // Set to cancelling — ends at next billing date
        const { error } = await supabase
            .from('subscriptions')
            .update({
                status:       'cancelling',
                cancel_reason: reason ?? null,
                cancelled_at:  new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', session.user.id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Also update profile subscription_status to 'cancelled' for nav gating
        // Note: we leave it as 'active' until billing date passes — 'cancelling' is the interim

        // Fetch profile for exit email
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', session.user.id)
            .maybeSingle()

        if (profile?.email) {
            await sendExitEmail({
                email:            profile.email,
                name:             profile.full_name ?? 'there',
                plan_tier:        subscription.plan_tier ?? 'essentials',
                next_billing_date: subscription.next_billing_date,
                reason,
            })
        }

        return NextResponse.json({
            success:           true,
            ends_on:           subscription.next_billing_date,
        })

    } catch (err: any) {
        console.error('Cancel subscription error:', err)
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
    }
}

// ─── Exit email ───────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
    essentials:    'Essentials',
    full_protocol: 'Full Protocol',
    restoration:   'Restoration Protocol',
}

async function sendExitEmail({ email, name, plan_tier, next_billing_date, reason }: {
    email: string; name: string; plan_tier: string;
    next_billing_date: string | null; reason: string
}) {
    const base     = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://toneek.vercel.app'
    const endsDate = next_billing_date
        ? new Date(next_billing_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'your next billing date'

    const SAVE_OFFERS: Record<string, string> = {
        too_expensive:        'We can pause your subscription for 60 days at no charge — just reply to this email.',
        results_not_expected: 'If your formula isn\'t working, we can reformulate at no extra cost. Reply to let us know.',
        need_a_break:         'We can pause for up to 60 days. Your formula stays active when you return.',
        moving:               'We ship internationally. Your formula can follow you — reply and we\'ll arrange it.',
        medical_reason:       'We understand. Your data and formula will be waiting when you\'re ready to return.',
        other:                'If there\'s anything we can do to help, please reply to this email.',
    }

    const saveOffer = SAVE_OFFERS[reason] ?? SAVE_OFFERS['other']

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from   = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

        await resend.emails.send({
            from,
            to: email,
            subject: `Your Toneek subscription — confirmed cancellation`,
            html: `
                <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                    <h2 style="margin:0 0 16px;">Cancellation confirmed</h2>
                    <p style="color:#374151;">Hi ${name},</p>
                    <p style="color:#374151;margin-bottom:24px;">
                        Your <strong>${PLAN_LABELS[plan_tier] ?? plan_tier}</strong> subscription 
                        will end on <strong>${endsDate}</strong>. 
                        You can reactivate anytime from your dashboard.
                    </p>
                    <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #059669;">
                        <p style="margin:0;color:#065f46;font-weight:600;">Before you go</p>
                        <p style="margin:6px 0 0;color:#047857;font-size:14px;">${saveOffer}</p>
                    </div>
                    <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">
                        Your skin data, formula history, and check-in records are safely stored 
                        and will be available if you return.
                    </p>
                    <a href="${base}/subscribe"
                       style="display:inline-block;background:#1a1a1a;color:white;
                              padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                        Reactivate my subscription →
                    </a>
                </div>
            `,
        })
    } catch (err) {
        console.error('Exit email failed (non-fatal):', err)
    }
}
