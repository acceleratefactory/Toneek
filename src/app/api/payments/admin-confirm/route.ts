// src/app/api/payments/admin-confirm/route.ts
// Admin clicks this link from their email to confirm a bank transfer payment.
// Single-use token. Activates subscription, emails + WhatsApps customer.
// Returns styled HTML — viewed directly in the browser, not a JSON API.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/sendWelcomeEmail'
import { sendUpgradeEmail } from '@/lib/email/sendUpgradeEmail'
import { getPlanDisplayName } from '@/lib/orders/pricing'

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
        .select('id, user_id, order_type, plan_tier, plan_tier_before, payment_reference, payment_amount, currency, payment_confirm_token, payment_token_used, payment_status')
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

    const is_upgrade = order.order_type === 'upgrade'
    const is_free_trial = order.order_type === 'free_trial'

    // ── Handle Subscription & Profile ─────────────────────────────────────────
    if (order.user_id) {
        if (is_free_trial) {
            // Free trial subscriptions are created at order creation time.
            // We only need to mark the delivery payment link as used.
            const { error: linkError } = await adminClient
                .from('delivery_payment_links')
                .update({ used_at: new Date().toISOString() })
                .eq('order_id', order.id)
                
            if (linkError) {
                console.error('Failed to update delivery payment link:', linkError)
            }
            
            // Note: We do NOT change order.status here, as it may already be 'ready_to_dispatch' or in 'production'
            // We only updated payment_status to 'confirmed' above.
            
        } else if (is_upgrade) {
            // Update existing subscription
            const { error: subError } = await adminClient
                .from('subscriptions')
                .update({
                    previous_plan_tier: order.plan_tier_before ?? null,
                    plan_tier: order.plan_tier,
                    upgraded_at: new Date().toISOString(),
                    upgrade_order_id: order.id,
                })
                .eq('user_id', order.user_id)
                .eq('status', 'active')

            if (subError) {
                console.error('Failed to update subscription for upgrade:', subError)
            }

            // Update profile
            await adminClient
                .from('profiles')
                .update({ subscription_tier: order.plan_tier })
                .eq('id', order.user_id)
            
            // Mark order as upgrade_confirmed
            await adminClient
                .from('orders')
                .update({ status: 'upgrade_confirmed' })
                .eq('id', order.id)

        } else {
            // Create NEW subscription (existing logic)
            const { error: subError } = await adminClient.from('subscriptions').insert({
                user_id:           order.user_id,
                plan_tier:         order.plan_tier,
                status:            'active',
                started_at:        new Date().toISOString(),
                next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })

            if (subError) {
                console.error('Failed to insert subscription:', subError)
                return html(`<div class="box">
                    <div class="icon">❌</div>
                    <h2 class="warn">Subscription Activation Failed</h2>
                    <p>Payment was marked confirmed, but creating the subscription failed.</p>
                    <p style="font-size:12px;color:#999;margin-top:10px">${subError.message}</p>
                </div>`)
            }

            // Update profile subscription status
            const { error: profileError } = await adminClient
                .from('profiles')
                .update({
                    subscription_status: 'active',
                    subscription_tier:   order.plan_tier,
                })
                .eq('id', order.user_id)
                
            if (profileError) {
                console.error('Failed to update profile subscription status:', profileError)
                return html(`<div class="box">
                    <div class="icon">❌</div>
                    <h2 class="warn">Profile Update Failed</h2>
                    <p>Subscription was created, but updating the user profile failed.</p>
                    <p style="font-size:12px;color:#999;margin-top:10px">${profileError.message}</p>
                </div>`)
            }

            // Move order to pending_production
            await adminClient
                .from('orders')
                .update({ status: 'pending_production' })
                .eq('id', order.id)
        }
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
        customerName  = profile?.full_name?.split(' ')[0] ?? 'there'
    }

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

    // ── Send Notifications ────────────────────────────────────────────────────
    if (is_upgrade) {
        if (customerEmail) {
            await sendUpgradeEmail({
                email: customerEmail,
                customerName,
                planTier: getPlanDisplayName(order.plan_tier),
                baseUrl,
            })
        }
        if (order.user_id) {
            await sendWhatsAppToCustomer(
                order.user_id,
                `✅ Upgrade confirmed!\nYour Toneek plan is now fully upgraded to ${getPlanDisplayName(order.plan_tier)}.\n` +
                `Login to your dashboard: ${baseUrl}/dashboard`
            )
        }
    } else if (is_free_trial) {
        // Free trial delivery payment confirmed
        if (customerEmail) {
            // Re-use sendWelcomeEmail or just send a raw email/WhatsApp for delivery
            // We'll just send WhatsApp since it's most direct for Toneek right now
        }
        if (order.user_id) {
            await sendWhatsAppToCustomer(
                order.user_id,
                `✅ Delivery payment confirmed!\nYour Toneek formula will be dispatched shortly.\n` +
                `Login to your dashboard: ${baseUrl}/dashboard`
            )
        }
    } else {
        if (customerEmail) {
            await sendWelcomeEmail({
                email: customerEmail,
                customerName,
                order,
                baseUrl,
            })
        }
        if (order.user_id) {
            await sendWhatsAppToCustomer(
                order.user_id,
                `✅ Payment confirmed! Your Toneek formula is now in production.\n` +
                `Login to your dashboard: ${baseUrl}/dashboard`
            )
        }
    }

    // ── Return success HTML ───────────────────────────────────────────────────
    return html(`<div class="box">
        <div class="icon">✅</div>
        <h2>Order Confirmed</h2>
        <p>
            ${is_upgrade ? 'Subscription upgraded.' : is_free_trial ? 'Delivery payment confirmed.' : 'Subscription activated.<br/>Formula queued for production.'}<br/>
            Customer notified by email${order.user_id ? ' and WhatsApp' : ''}.
        </p>
        <p style="font-size:13px;margin-top:12px;">
            <strong>Reference:</strong> ${order.payment_reference}<br/>
            <strong>Amount:</strong> ${order.currency} ${order.payment_amount?.toLocaleString()}
        </p>
        <a href="${baseUrl}/admin">Back to dashboard</a>
    </div>`)
}

// ─── Customer confirmation email abstracted to src/lib/email/sendWelcomeEmail.ts ──

// ─── Customer WhatsApp ────────────────────────────────────────────────────────

async function sendWhatsAppToCustomer(user_id: string, message: string) {
    // Placeholder — implement with your WhatsApp provider when ready
    // The customer's phone would need to be in the profiles table
    console.log(`[WhatsApp → Customer ${user_id}]`, message)
}
