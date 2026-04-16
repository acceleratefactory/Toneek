// src/app/api/cron/overnight-payments/route.ts
// Runs at 6:55 UTC daily (7:55 WAT) via Vercel cron.
// Sends admin a morning WhatsApp summary of orders still awaiting confirmation.
// Secured with CRON_SECRET so only Vercel's scheduler can trigger it.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {

    // ── Security — only Vercel cron should call this ──────────────────────────
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Find orders claimed more than 8 hours ago still pending ───────────────
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()

    const { data: pendingOrders, error } = await adminClient
        .from('orders')
        .select('payment_reference, currency, payment_amount, customer_claimed_sent_at, plan_tier')
        .eq('payment_status', 'pending_verification')
        .lt('customer_claimed_sent_at', eightHoursAgo)

    if (error) {
        console.error('Overnight cron query error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!pendingOrders || pendingOrders.length === 0) {
        console.log('[Cron] No pending payments this morning.')
        return NextResponse.json({ processed: 0, message: 'No pending payments' })
    }

    // ── Build summary message ─────────────────────────────────────────────────
    const lines = pendingOrders.map(o =>
        `• ${o.payment_reference} — ${o.currency} ${o.payment_amount?.toLocaleString()} (${o.plan_tier})`
    )

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    const message =
        `☀️ Good morning. ${pendingOrders.length} payment${pendingOrders.length > 1 ? 's' : ''} awaiting confirmation:\n\n` +
        lines.join('\n') +
        `\n\nConfirm each from your admin dashboard:\n${baseUrl}/admin`

    // ── Send WhatsApp to admin ─────────────────────────────────────────────
    await sendAdminWhatsApp(message)

    // ── Also send a morning summary email ────────────────────────────────────
    await sendMorningSummaryEmail(pendingOrders, baseUrl)

    console.log(`[Cron] Morning summary sent — ${pendingOrders.length} pending payment(s)`)

    return NextResponse.json({
        processed: pendingOrders.length,
        orders: pendingOrders.map(o => o.payment_reference),
    })
}

// ─── Admin WhatsApp ───────────────────────────────────────────────────────────

async function sendAdminWhatsApp(message: string) {
    const phone  = process.env.ADMIN_WHATSAPP_NUMBER
    const apiUrl = process.env.WHATSAPP_API_URL
    const apiKey = process.env.WHATSAPP_API_TOKEN

    if (!phone || !apiUrl) {
        console.log('[Cron WhatsApp → Admin]', message)
        return
    }

    try {
        await fetch(
            `${apiUrl}?phone=${encodeURIComponent(phone)}&apikey=${apiKey}&text=${encodeURIComponent(message)}`
        )
    } catch (err) {
        console.error('[Cron] WhatsApp send failed (non-fatal):', err)
    }
}

// ─── Morning summary email ────────────────────────────────────────────────────

async function sendMorningSummaryEmail(orders: any[], baseUrl: string) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) return

    const rows = orders.map(o => `
        <tr>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${o.payment_reference}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${o.currency} ${o.payment_amount?.toLocaleString()}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${o.plan_tier}</td>
        </tr>
    `).join('')

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from   = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

        await resend.emails.send({
            from,
            to: adminEmail,
            subject: `☀️ Morning payment summary — ${orders.length} pending`,
            html: `
                <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                    <h2 style="margin:0 0 8px;">Morning Payment Summary</h2>
                    <p style="color:#6b7280;margin:0 0 24px;">
                        ${orders.length} payment${orders.length > 1 ? 's' : ''} claimed over 8 hours ago and still awaiting your confirmation.
                    </p>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                        <thead>
                            <tr style="background:#f9fafb;">
                                <th style="padding:10px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Reference</th>
                                <th style="padding:10px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Amount</th>
                                <th style="padding:10px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Plan</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <a href="${baseUrl}/admin"
                       style="display:inline-block;background:#0f0f0f;color:#fff;
                              padding:14px 28px;border-radius:8px;text-decoration:none;
                              font-weight:600;">
                        Go to admin dashboard →
                    </a>
                </div>
            `,
        })
    } catch (err) {
        console.error('[Cron] Morning email failed (non-fatal):', err)
    }
}
