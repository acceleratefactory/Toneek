// src/app/api/orders/create/route.ts
// Creates an order + bank transfer session when a customer selects a plan.
// Called by SubscribePlans component after plan selection.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Pricing is fetched dynamically from the subscription_tiers database table

import { getBankDetails, getPlanPrice, getPlanPriceFromDB } from '@/lib/orders/pricing'

// ─── Route handler ────────────────────────────────────────────────────────────

import { assignFourthProduct } from '@/lib/orders/assignFourthProduct'

const HALF_PRICE: Record<string, Record<string, Record<string, number>>> = {
  two_to_three: {
    essentials:    { NGN: 16000, GBP: 26, USD: 34, EUR: 29, GHS: 200, CAD: 43 },
    full_protocol: { NGN: 19000, GBP: 31, USD: 40, EUR: 35, GHS: 240, CAD: 50 },
    restoration:   { NGN: 31000, GBP: 48, USD: 63, EUR: 54, GHS: 390, CAD: 78 },
  },
  whatever_it_takes: {
    essentials:    { NGN: 24000, GBP: 38, USD: 49, EUR: 43, GHS: 300, CAD: 63 },
    full_protocol: { NGN: 29000, GBP: 45, USD: 58, EUR: 50, GHS: 370, CAD: 73 },
    restoration:   { NGN: 43000, GBP: 65, USD: 85, EUR: 74, GHS: 525, CAD: 108 },
  },
}

export async function POST(request: NextRequest) {
    try {
        const { assessment_id, user_id, plan_tier, currency, is_free_trial, is_half_price } = await request.json()

        if (!assessment_id || !plan_tier || !currency) {
            return NextResponse.json(
                { error: 'Missing required fields: assessment_id, plan_tier, currency' },
                { status: 400 }
            )
        }

        // Get assessment to link formula_code to the order and determine companion products
        const { data: assessment } = await adminClient
            .from('skin_assessments')
            .select('formula_code, routine_expectation, primary_concern, climate_zone, skin_type, barrier_integrity, formula_tier, analysis_scores, medications, pregnant_or_breastfeeding')
            .eq('id', assessment_id)
            .single()

        // Resolve UUID to canonical string (Prevents UUID leak in emails and fixes pricing fallback)
        let canonical_plan_tier = plan_tier;
        if (plan_tier.length === 36 && plan_tier.includes('-')) {
            const { data: tierData } = await adminClient
                .from('subscription_tiers')
                .select('name')
                .eq('id', plan_tier)
                .single()
            if (tierData?.name) {
                const rawName = tierData.name.toLowerCase()
                if (rawName.includes('full')) canonical_plan_tier = 'full_protocol'
                else if (rawName.includes('restoration')) canonical_plan_tier = 'restoration'
                else canonical_plan_tier = 'essentials'
            }
        }

        const routine_tier = assessment?.routine_expectation || 'just_one'

        // Fetch dynamic pricing using database matrix
        let amount;
        try {
            amount = await getPlanPriceFromDB(canonical_plan_tier, currency, routine_tier, adminClient);
        } catch (priceErr: any) {
            return NextResponse.json({ error: priceErr.message }, { status: 400 });
        }

        if (is_half_price) {
            const halfPriceAmount = HALF_PRICE[routine_tier]?.[canonical_plan_tier]?.[currency]
            if (halfPriceAmount) {
                amount = halfPriceAmount
            }
        } else if (is_free_trial) {
            amount = 0
        }

        // Generate unique payment reference — TNOK-TIMESTAMP-XXXX
        const random = Math.floor(1000 + Math.random() * 9000)
        const payment_reference = `TNOK-${Date.now()}-${random}`

        // Generate secure single-use admin confirmation token (double UUID)
        const confirm_token = `${crypto.randomUUID()}-${crypto.randomUUID()}`
        
        let fourth_product_sku = null
        let fourth_product_name = null
        let fourth_product_rationale = null

        if (routine_tier === 'whatever_it_takes' && assessment) {
            const assignment = assignFourthProduct({
                primary_concern: assessment.primary_concern,
                skin_type: assessment.skin_type,
                climate_zone: assessment.climate_zone,
                barrier_integrity: assessment.analysis_scores?.barrier_integrity ?? 75,
                analysis_scores: assessment.analysis_scores ?? {},
                formula_tier: assessment.formula_tier,
                medications: assessment.medications ?? [],
                pregnant_or_breastfeeding: assessment.pregnant_or_breastfeeding ?? false,
            })

            fourth_product_sku = assignment.sku
            fourth_product_name = assignment.display_name
            fourth_product_rationale = assignment.rationale
        }

        // Create order (user_id may be null until OTP confirmed)
        const orderPayload: Record<string, any> = {
            plan_tier: canonical_plan_tier,
            payment_amount: amount,
            currency,
            payment_method: 'bank_transfer',
            payment_status: 'pending',
            payment_reference,
            payment_confirm_token: confirm_token,
            payment_token_used: false,
            status: is_free_trial ? 'pending_production' : 'pending_payment',
            order_type: is_free_trial ? 'free_trial' : 'new',
            routine_tier,
            fourth_product: fourth_product_sku,
            fourth_product_name,
            fourth_product_rationale,
        }

        if (is_free_trial) {
            orderPayload.formula_cost_waived = true
            orderPayload.delivery_fee = null
            orderPayload.delivery_fee_currency = null
            orderPayload.delivery_region = null
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

        // Create trial subscription immediately if free trial
        if (is_free_trial && user_id) {
            const trial_end = new Date()
            trial_end.setDate(trial_end.getDate() + 30) // add 30 days
            
            await adminClient.from('subscriptions').insert({
              user_id,
              plan_tier: canonical_plan_tier,
              status: 'trial',
              is_trial: true,
              started_at: new Date().toISOString(),
              trial_ends_at: trial_end.toISOString(),
              next_billing_date: trial_end.toISOString(),
            })
            
            await adminClient.from('profiles').update({
              subscription_tier: canonical_plan_tier,
              subscription_status: 'trial',
            }).eq('id', user_id)
            
            // TODO: Send "formula being prepared" email
        }

        // Create bank transfer session (only when user exists and it's not a free trial)
        if (user_id && !is_free_trial) {
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

        const bankDetails = !is_free_trial ? getBankDetails(currency) : null

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
