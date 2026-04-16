// src/app/api/payments/claim-sent/route.ts
// Called when customer clicks "I've sent the money" in the BankTransferModal.
// Updates order to pending_verification, notifies admin, acknowledges customer.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { order_id } = await request.json()

        if (!order_id) {
            return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
        }

        // Update order to pending_verification + record claim timestamp
        const { data: order, error: updateError } = await adminClient
            .from('orders')
            .update({
                payment_status: 'pending_verification',
                customer_claimed_sent_at: new Date().toISOString(),
            })
            .eq('id', order_id)
            .select('id, user_id, payment_reference, payment_amount, payment_confirm_token, currency, plan_tier, status')
            .single()

        if (updateError || !order) {
            console.error('Claim sent update error:', updateError)
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // ── Resolve customer email ────────────────────────────────────────────
        // Try profile first (linked users), then fall back to assessment record
        let customerEmail: string | null = null
        let customerName = 'Customer'

        if (order.user_id) {
            const { data: profile } = await adminClient
                .from('profiles')
                .select('email, full_name')
                .eq('id', order.user_id)
                .single()
            customerEmail = profile?.email ?? null
            customerName = profile?.full_name ?? 'Customer'
        }

        if (!customerEmail) {
            // Anonymous user — look up email from most recent assessment for this order
            const { data: assessment } = await adminClient
                .from('skin_assessments')
                .select('email')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            customerEmail = (assessment as any)?.email ?? null
        }

        // ── Build admin confirm URL ───────────────────────────────────────────
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
        const confirmUrl = `${baseUrl}/api/payments/admin-confirm?order_id=${order.id}&token=${order.payment_confirm_token}`

        // ── Confirmation window (8am–10pm WAT = UTC+1) ───────────────────────
        const hourWAT = (new Date().getUTCHours() + 1) % 24
        const inWindow = hourWAT >= 8 && hourWAT < 22
        const estimatedConfirmation = inWindow ? 'within 2 hours' : 'from 8:00 AM tomorrow (WAT)'

        // ── Send admin WhatsApp (primary alert) ──────────────────────────────
        await sendAdminWhatsApp(
            `💰 Payment claimed\n` +
            `Order: ${order.payment_reference}\n` +
            `Amount: ${order.currency} ${order.payment_amount?.toLocaleString()}\n` +
            `Plan: ${order.plan_tier}\n` +
            `Customer: ${customerName}\n\n` +
            `✅ Confirm payment:\n${confirmUrl}`
        )

        // ── Send admin email (backup with full details + button) ─────────────
        await sendAdminEmail({ order, customerName, confirmUrl })

        // ── Acknowledge customer ─────────────────────────────────────────────
        if (customerEmail) {
            await sendCustomerAcknowledgement({
                email: customerEmail,
                customerName,
                order_reference: order.payment_reference,
                amount: order.payment_amount,
                currency: order.currency,
                estimated: estimatedConfirmation,
                baseUrl,
            })
        }

        return NextResponse.json({ success: true, estimated: estimatedConfirmation })

    } catch (err: any) {
        console.error('Claim sent unexpected error:', err)
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
    }
}

// ─── Admin WhatsApp ───────────────────────────────────────────────────────────

async function sendAdminWhatsApp(message: string) {
    const phone  = process.env.ADMIN_WHATSAPP_NUMBER
    const apiUrl = process.env.WHATSAPP_API_URL
    const apiKey = process.env.WHATSAPP_API_TOKEN

    if (!phone || !apiUrl) {
        // Not yet configured — log for visibility
        console.log('[WhatsApp → Admin]', message)
        return
    }

    try {
        await fetch(`${apiUrl}?phone=${encodeURIComponent(phone)}&apikey=${apiKey}&text=${encodeURIComponent(message)}`)
    } catch (err) {
        console.error('WhatsApp send failed (non-fatal):', err)
    }
}

// ─── Admin email ──────────────────────────────────────────────────────────────

async function sendAdminEmail({ order, customerName, confirmUrl }: {
    order: any, customerName: string, confirmUrl: string
}) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
        console.log('[Email → Admin] ADMIN_EMAIL not set — skipping')
        return
    }

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

        await resend.emails.send({
            from,
            to: adminEmail,
            subject: `💰 Payment claimed — ${order.payment_reference}`,
            html: `
                <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                    <h2 style="color:#059669;margin:0 0 24px;">Bank Transfer Payment Claimed</h2>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                        <tr>
                            <td style="padding:10px 0;color:#666;width:40%;">Order Reference</td>
                            <td style="padding:10px 0;font-weight:600;">${order.payment_reference}</td>
                        </tr>
                        <tr>
                            <td style="padding:10px 0;color:#666;">Customer</td>
                            <td style="padding:10px 0;">${customerName}</td>
                        </tr>
                        <tr>
                            <td style="padding:10px 0;color:#666;">Amount</td>
                            <td style="padding:10px 0;font-weight:600;">${order.currency} ${order.payment_amount?.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style="padding:10px 0;color:#666;">Plan</td>
                            <td style="padding:10px 0;">${order.plan_tier}</td>
                        </tr>
                    </table>
                    <p style="margin:0 0 16px;color:#374151;">
                        Once you confirm the bank transfer has arrived in your account, click below:
                    </p>
                    <a href="${confirmUrl}"
                       style="display:inline-block;background:#059669;color:#fff;
                              padding:14px 28px;border-radius:8px;text-decoration:none;
                              font-weight:600;font-size:16px;">
                        ✅ Confirm Payment &amp; Activate Subscription
                    </a>
                    <p style="color:#9ca3af;font-size:12px;margin-top:20px;">
                        Single-use link. Activates subscription immediately and notifies the customer.
                    </p>
                </div>
            `,
        })
    } catch (err) {
        console.error('Admin email send failed (non-fatal):', err)
    }
}

// ─── Customer acknowledgement email ──────────────────────────────────────────

async function sendCustomerAcknowledgement({ email, customerName, order_reference, amount, currency, estimated, baseUrl }: {
    email: string; customerName: string; order_reference: string;
    amount: number; currency: string; estimated: string; baseUrl: string
}) {
    const SYMBOLS: Record<string, string> = {
        NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵', CAD: 'CA$',
    }
    const symbol = SYMBOLS[currency] ?? ''

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

        await resend.emails.send({
            from,
            to: email,
            subject: `We've received your payment notification — ${order_reference}`,
            html: `
                <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                    <h2 style="margin:0 0 16px;">We've got your notification</h2>
                    <p style="color:#374151;margin:0 0 16px;">Hi ${customerName},</p>
                    <p style="color:#374151;margin:0 0 24px;">
                        Your transfer has been logged. Here's what happens next:
                    </p>
                    <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                        <p style="margin:0;color:#065f46;font-weight:600;">
                            Confirmation expected: ${estimated}
                        </p>
                    </div>
                    <p style="color:#374151;margin:0 0 12px;">The moment your payment is confirmed:</p>
                    <ul style="color:#374151;padding-left:20px;margin:0 0 24px;">
                        <li style="margin-bottom:6px;">Your subscription activates immediately</li>
                        <li style="margin-bottom:6px;">Your formula goes into production</li>
                        <li style="margin-bottom:6px;">You receive a WhatsApp + email confirmation</li>
                        <li>Your dashboard unlocks</li>
                    </ul>
                    <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                        <p style="margin:0;color:#6b7280;font-size:14px;">
                            <strong>Reference:</strong> ${order_reference}<br/>
                            <strong>Amount:</strong> ${symbol}${amount?.toLocaleString()}
                        </p>
                    </div>
                    <p style="color:#6b7280;font-size:14px;margin:0;">
                        No action needed from you. We'll be in touch soon.
                    </p>
                </div>
            `,
        })
    } catch (err) {
        console.error('Customer acknowledgement email failed (non-fatal):', err)
    }
}
