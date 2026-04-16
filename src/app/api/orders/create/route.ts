// src/app/api/orders/create/route.ts
// Creates an order + bank transfer session when a customer selects a plan.
// Called by SubscribePlans component after plan selection.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// ─── Pricing ─────────────────────────────────────────────────────────────────

const PRICES: Record<string, Record<string, number>> = {
    essentials:    { NGN: 18000, GBP: 35,  USD: 45, EUR: 38, GHS: 250, CAD: 55  },
    full_protocol: { NGN: 22000, GBP: 42,  USD: 55, EUR: 48, GHS: 320, CAD: 70  },
    restoration:   { NGN: 35000, GBP: 68,  USD: 88, EUR: 75, GHS: 500, CAD: 110 },
}

function getPlanPrice(plan_tier: string, currency: string): number {
    return PRICES[plan_tier]?.[currency] ?? PRICES[plan_tier]?.['USD'] ?? 45
}

// ─── Bank details from env vars ───────────────────────────────────────────────

function getBankDetails(currency: string) {
    const MAP: Record<string, Record<string, string | undefined>> = {
        NGN: {
            bank_name:      process.env.BANK_NGN_NAME,
            account_name:   process.env.BANK_NGN_ACCOUNT_NAME,
            account_number: process.env.BANK_NGN_ACCOUNT_NUMBER,
        },
        GBP: {
            bank_name:      process.env.BANK_GBP_NAME,
            account_name:   process.env.BANK_GBP_ACCOUNT_NAME,
            account_number: process.env.BANK_GBP_ACCOUNT_NUMBER,
            sort_code:      process.env.BANK_GBP_SORT_CODE,
        },
        USD: {
            bank_name:       process.env.BANK_USD_NAME,
            account_name:    process.env.BANK_USD_ACCOUNT_NAME,
            account_number:  process.env.BANK_USD_ACCOUNT_NUMBER,
            routing_number:  process.env.BANK_USD_ROUTING_NUMBER,
        },
        EUR: {
            bank_name:    process.env.BANK_EUR_NAME,
            account_name: process.env.BANK_EUR_ACCOUNT_NAME,
            iban:         process.env.BANK_EUR_IBAN,
        },
        GHS: {
            bank_name:      process.env.BANK_GHS_NAME,
            account_name:   process.env.BANK_GHS_ACCOUNT_NAME,
            account_number: process.env.BANK_GHS_ACCOUNT_NUMBER,
        },
    }
    // Fallback to USD if currency not configured
    return MAP[currency] ?? MAP['USD']
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const { assessment_id, user_id, plan_tier, currency } = await request.json()

        if (!assessment_id || !plan_tier || !currency) {
            return NextResponse.json(
                { error: 'Missing required fields: assessment_id, plan_tier, currency' },
                { status: 400 }
            )
        }

        if (!PRICES[plan_tier]) {
            return NextResponse.json(
                { error: `Unknown plan_tier: ${plan_tier}` },
                { status: 400 }
            )
        }

        // Get assessment to link formula_code to the order
        const { data: assessment } = await adminClient
            .from('skin_assessments')
            .select('formula_code')
            .eq('id', assessment_id)
            .single()

        const amount = getPlanPrice(plan_tier, currency)

        // Generate unique payment reference — TNOK-TIMESTAMP-XXXX
        const random = Math.floor(1000 + Math.random() * 9000)
        const payment_reference = `TNOK-${Date.now()}-${random}`

        // Generate secure single-use admin confirmation token (double UUID)
        const confirm_token = `${crypto.randomUUID()}-${crypto.randomUUID()}`

        // Create order (user_id may be null until OTP confirmed)
        const orderPayload: Record<string, any> = {
            plan_tier,
            payment_amount: amount,
            currency,
            payment_method: 'bank_transfer',
            payment_status: 'pending',
            payment_reference,
            payment_confirm_token: confirm_token,
            payment_token_used: false,
            status: 'pending_payment',
        }

        if (user_id)          orderPayload.user_id = user_id
        if (assessment?.formula_code) orderPayload.formula_code = assessment.formula_code

        const { data: order, error: orderError } = await adminClient
            .from('orders')
            .insert(orderPayload)
            .select()
            .single()

        if (orderError || !order) {
            console.error('Order create error:', orderError)
            return NextResponse.json(
                { error: orderError?.message ?? 'Failed to create order' },
                { status: 500 }
            )
        }

        // Create bank transfer session (only when user exists — required by FK)
        if (user_id) {
            const bankDetails = getBankDetails(currency)
            await adminClient.from('bank_transfer_sessions').insert({
                order_id:       order.id,
                user_id,
                payment_reference,
                amount,
                currency,
                bank_name:      bankDetails.bank_name     ?? null,
                account_name:   bankDetails.account_name  ?? null,
                account_number: bankDetails.account_number ?? null,
                sort_code:      bankDetails.sort_code      ?? null,
                routing_number: bankDetails.routing_number ?? null,
                iban:           bankDetails.iban            ?? null,
                expires_at:     new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                status: 'active',
            })
        }

        const bankDetails = getBankDetails(currency)

        return NextResponse.json({
            order_id:          order.id,
            payment_reference,
            amount,
            currency,
            bank_details:      bankDetails,
        })

    } catch (err: any) {
        console.error('Order create unexpected error:', err)
        return NextResponse.json(
            { error: 'Unexpected server error' },
            { status: 500 }
        )
    }
}
