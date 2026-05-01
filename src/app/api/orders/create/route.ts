// src/app/api/orders/create/route.ts
// Creates an order + bank transfer session when a customer selects a plan.
// Called by SubscribePlans component after plan selection.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Pricing is fetched dynamically from the subscription_tiers database table

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

function determineFourthProduct(assessment: any): string {
    const { primary_concern, climate_zone, skin_type, barrier_integrity } = assessment
    
    if (['equatorial', 'semi_arid', 'humid_tropical'].includes(climate_zone || '') && primary_concern === 'PIH') {
        return 'toneek_mineral_spf_50'
    }
    
    if ((skin_type === 'dry' || barrier_integrity < 60) && ['temperate_maritime', 'cold_continental'].includes(climate_zone || '')) {
        return 'toneek_hydrating_toner'
    }
    
    if (['PIH', 'tone'].includes(primary_concern || '')) {
        return 'toneek_brightening_toner'
    }
    
    return 'toneek_mineral_spf_50'
}

export async function POST(request: NextRequest) {
    try {
        const { assessment_id, user_id, plan_tier, currency } = await request.json()

        if (!assessment_id || !plan_tier || !currency) {
            return NextResponse.json(
                { error: 'Missing required fields: assessment_id, plan_tier, currency' },
                { status: 400 }
            )
        }



        // Get assessment to link formula_code to the order and determine companion products
        const { data: assessment } = await adminClient
            .from('skin_assessments')
            .select('formula_code, routine_expectation, primary_concern, climate_zone, skin_type, barrier_integrity')
            .eq('id', assessment_id)
            .single()

        // Fetch dynamic pricing from database
        const { data: tier } = await adminClient
            .from('subscription_tiers')
            .select('prices')
            .eq('id', plan_tier)
            .single()

        if (!tier || !tier.prices) {
            return NextResponse.json(
                { error: `Pricing not found for plan_tier: ${plan_tier}` },
                { status: 400 }
            )
        }

        const exactPriceData = tier.prices[currency] || tier.prices['USD']
        const amount = exactPriceData?.amount || 45

        // Generate unique payment reference — TNOK-TIMESTAMP-XXXX
        const random = Math.floor(1000 + Math.random() * 9000)
        const payment_reference = `TNOK-${Date.now()}-${random}`

        // Generate secure single-use admin confirmation token (double UUID)
        const confirm_token = `${crypto.randomUUID()}-${crypto.randomUUID()}`

        const routine_tier = assessment?.routine_expectation || 'just_one'
        const fourth_product = routine_tier === 'whatever_it_takes'
            ? determineFourthProduct(assessment || {})
            : null

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
            routine_tier,
            fourth_product,
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
