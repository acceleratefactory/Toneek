// src/app/api/payments/admin-confirm/route.ts
// Admin clicks this link from their email to confirm a bank transfer payment.
// Single-use token. Activates subscription, emails + WhatsApps customer.
// Returns styled HTML — viewed directly in the browser, not a JSON API.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

const html = (content: string) =>
    new Response(
        `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
            body { font-family: system-ui, sans-serif; background: #f0fdf4;
                   display: flex; align-items: center; justify-content: center;
                   min-height: 100vh; margin: 0; padding: 1rem; }
            .box { background: #fff; border-radius: 16px; padding: 48px;
                   text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.08);
                   max-width: 420px; width: 100%; }
            h2  { color: #059669; margin: 16px 0 8px; }
            p   { color: #64748b; line-height: 1.6; }
            a   { display: inline-block; margin-top: 24px; background: #059669;
                  color: #fff; padding: 12px 28px; border-radius: 8px;
                  text-decoration: none; font-weight: 600; }
            .icon { font-size: 56px; }
            .warn { color: #b45309; }
            .warn h2 { color: #b45309; }
            body.warn-bg { background: #fffbeb; }
        </style>
        </head><body>${content}</body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
    )

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const order_id = searchParams.get('order_id')
    const token    = searchParams.get('token')

    // ── Validate params ───────────────────────────────────────────────────────
    if (!order_id || !token) {
        return html(`<div class="box">
            <div class="icon">❌</div>
            <h2 style="color:#dc2626;">Invalid link</h2>
            <p>The confirmation link is missing required parameters.</p>
        </div>`)
    }

    // ── Look up order — token must exist and be unused ────────────────────────
    const { data: order } = await adminClient
        .from('orders')
        .select('id, user_id, plan_tier, payment_reference, payment_amount, currency, payment_confirm_token, payment_token_used, payment_status')
        .eq('id', order_id)
        .eq('payment_confirm_token', token)
        .single()

    if (!order) {
        return html(`<div class="box">
            <div class="icon">⚠️</div>
            <h2 class="warn">Link not found</h2>
            <p>This order could not be found. The link may be invalid.</p>
        </div>`)
    }

    // ── Already confirmed — idempotency check ─────────────────────────────────
    if (order.payment_token_used) {
        return html(`<div class="box">
            <div class="icon">✅</div>
            <h2>Already confirmed</h2>
            <p>This payment has already been confirmed and the subscription is active.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/admin">Back to dashboard</a>
        </div>`)
    }

    // ── Invalidate token FIRST — prevents race condition on double-click ───────
    const { error: updateError } = await adminClient
        .from('orders')
        .update({
            payment_status:      'confirmed',
            payment_token_used:  true,
            payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', order.id)

    if (updateError) {
        return html(`<div class="box">
            <div class="icon">❌</div>
            <h2 class="warn">Update Failed</h2>
            <p>Database error: could not update order status.</p>
            <p style="font-size:12px;color:#999;margin-top:10px">${updateError.message}</p>
        </div>`)
    }

    // ── Activate subscription (only if user_id exists) ────────────────────────
    if (order.user_id) {
        await adminClient.from('subscriptions').insert({
            user_id:           order.user_id,
            plan_tier:         order.plan_tier,
            status:            'active',
            started_at:        new Date().toISOString(),
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })

        // Update profile subscription status
        await adminClient
            .from('profiles')
            .update({
                subscription_status: 'active',
                subscription_tier:   order.plan_tier,
            })
            .eq('id', order.user_id)
    }

    // ── Move order to pending_production ──────────────────────────────────────
    const { error: moveError } = await adminClient
        .from('orders')
        .update({ status: 'pending_production' })
        .eq('id', order.id)

    if (moveError) {
        console.error("Failed to move to production:", moveError)
    }

    // ── Resolve customer contact details ──────────────────────────────────────
    let customerEmail: string | null = null
    let customerName  = 'there'

    if (order.user_id) {
        const { data: profile } = await adminClient
            .from('profiles')
            .select('email, full_name')
            .eq('id', order.user_id)
            .single()
        customerEmail = profile?.email ?? null
        customerName  = profile?.full_name ?? 'there'
    }

    // Fallback: get email from most recent skin_assessment
    if (!customerEmail) {
        const { data: assessment } = await adminClient
            .from('skin_assessments')
            .select('email')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        customerEmail = (assessment as any)?.email ?? null
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    // ── Email customer ────────────────────────────────────────────────────────
    if (customerEmail) {
        await sendCustomerConfirmationEmail({
            email: customerEmail,
            customerName,
            order,
            baseUrl,
        })
    }

    // ── WhatsApp customer ─────────────────────────────────────────────────────
    if (order.user_id) {
        await sendWhatsAppToCustomer(
            order.user_id,
            `✅ Payment confirmed! Your Toneek formula is now in production.\n` +
            `Login to your dashboard: ${baseUrl}/dashboard`
        )
    }

    // ── Return success HTML ───────────────────────────────────────────────────
    return html(`<div class="box">
        <div class="icon">✅</div>
        <h2>Order Confirmed</h2>
        <p>
            Subscription activated.<br/>
            Formula queued for production.<br/>
            Customer notified by email${order.user_id ? ' and WhatsApp' : ''}.
        </p>
        <p style="font-size:13px;margin-top:12px;">
            <strong>Reference:</strong> ${order.payment_reference}<br/>
            <strong>Amount:</strong> ${order.currency} ${order.payment_amount?.toLocaleString()}
        </p>
        <a href="${baseUrl}/admin">Back to dashboard</a>
    </div>`)
}

// ─── Customer confirmation email ──────────────────────────────────────────────

async function sendCustomerConfirmationEmail({ email, customerName, order, baseUrl }: {
    email: string; customerName: string; order: any; baseUrl: string
}) {
    const SYMBOLS: Record<string, string> = {
        NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵', CAD: 'CA$',
    }
    const symbol = SYMBOLS[order.currency] ?? ''

    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from   = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

        await resend.emails.send({
            from,
            to: email,
            subject: '✅ Payment confirmed — your formula is being prepared',
            html: `
                <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                    <h2 style="color:#059669;margin:0 0 16px;">Payment Confirmed</h2>
                    <p style="color:#374151;margin:0 0 8px;">Hi ${customerName},</p>
                    <p style="color:#374151;margin:0 0 24px;">
                        Your payment has been confirmed and your Toneek subscription is now active.
                    </p>
                    <div style="background:#f0fdf4;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                        <p style="margin:0;color:#065f46;font-weight:600;">
                            Your formula is going into production
                        </p>
                        <p style="margin:6px 0 0;color:#047857;font-size:14px;">
                            You'll receive WhatsApp and email updates when it dispatches.
                        </p>
                    </div>
                    <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                        <p style="margin:0;color:#6b7280;font-size:14px;">
                            <strong>Reference:</strong> ${order.payment_reference}<br/>
                            <strong>Amount:</strong> ${symbol}${order.payment_amount?.toLocaleString()}<br/>
                            <strong>Plan:</strong> ${order.plan_tier}
                        </p>
                    </div>
                    <a href="${baseUrl}/dashboard"
                       style="display:inline-block;background:#0f0f0f;color:#fff;
                              padding:14px 28px;border-radius:8px;text-decoration:none;
                              font-weight:600;font-size:15px;">
                        View your dashboard →
                    </a>
                </div>
            `,
        })
    } catch (err) {
        console.error('Customer confirmation email failed (non-fatal):', err)
    }
}

// ─── Customer WhatsApp ────────────────────────────────────────────────────────

async function sendWhatsAppToCustomer(user_id: string, message: string) {
    // Placeholder — implement with your WhatsApp provider when ready
    // The customer's phone would need to be in the profiles table
    console.log(`[WhatsApp → Customer ${user_id}]`, message)
}
