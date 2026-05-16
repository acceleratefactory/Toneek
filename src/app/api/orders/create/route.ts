// src/app/api/orders/create/route.ts
// Creates an order + bank transfer session when a customer selects a plan.
// Called by SubscribePlans component after plan selection.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Pricing is fetched dynamically from the subscription_tiers database table

import { getBankDetails, getPlanPrice } from '@/lib/orders/pricing'

// ─── Route handler ────────────────────────────────────────────────────────────

import { assignFourthProduct } from '@/lib/orders/assignFourthProduct'

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
            .select('formula_code, routine_expectation, primary_concern, climate_zone, skin_type, barrier_integrity, formula_tier, analysis_scores, medications, pregnant_or_breastfeeding')
            .eq('id', assessment_id)
            .single()

        // Fetch dynamic pricing using shared utility
        let amount;
        try {
            amount = await getPlanPrice(plan_tier, currency);
        } catch (priceErr: any) {
            return NextResponse.json({ error: priceErr.message }, { status: 400 });
        }

        // Generate unique payment reference — TNOK-TIMESTAMP-XXXX
        const random = Math.floor(1000 + Math.random() * 9000)
        const payment_reference = `TNOK-${Date.now()}-${random}`

        // Generate secure single-use admin confirmation token (double UUID)
        const confirm_token = `${crypto.randomUUID()}-${crypto.randomUUID()}`

        const routine_tier = assessment?.routine_expectation || 'just_one'
        
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
            fourth_product: fourth_product_sku,
            fourth_product_name,
            fourth_product_rationale,
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
