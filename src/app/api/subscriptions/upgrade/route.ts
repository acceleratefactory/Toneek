// src/app/api/subscriptions/upgrade/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getPlanPrice, getBankDetails } from '@/lib/orders/pricing'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { target_plan_tier } = await request.json()
  // target_plan_tier: 'full_protocol' or 'restoration'

  // Get current subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, plan_tier, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
  }

  if (subscription.plan_tier === target_plan_tier) {
    return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
  }

  // Get customer currency from their latest order
  const { data: latestOrder } = await supabase
    .from('orders')
    .select('currency, routine_tier')
    .eq('user_id', user.id)
    .eq('payment_status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const currency = latestOrder?.currency ?? 'NGN'
  const routine_tier = latestOrder?.routine_tier ?? 'just_one'

  // Get the price for the upgraded plan
  // Use the SAME routine_tier they are already on
  // If they are a just_one customer upgrading, they get just_one full_protocol price
  const amount = await getPlanPrice(target_plan_tier, currency, routine_tier)

  // Create the upgrade order
  const random = Math.floor(1000 + Math.random() * 9000)
  const payment_reference = `TNOK-${Date.now()}-${random}`
  const confirm_token = `${crypto.randomUUID()}-${crypto.randomUUID()}`

  const { data: upgradeOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      plan_tier: target_plan_tier,
      plan_tier_before: subscription.plan_tier,
      payment_amount: amount,
      currency,
      payment_method: 'bank_transfer',
      payment_status: 'pending',
      payment_reference,
      payment_confirm_token: confirm_token,
      payment_token_used: false,
      status: 'pending_payment',
      order_type: 'upgrade',
      routine_tier,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // Create bank transfer session
  const bankDetails = getBankDetails(currency)

  await supabase.from('bank_transfer_sessions').insert({
    order_id: upgradeOrder.id,
    user_id: user.id,
    payment_reference,
    amount,
    currency,
    bank_name: bankDetails.bank_name,
    account_name: bankDetails.account_name,
    account_number: bankDetails.account_number,
    sort_code: bankDetails.sort_code ?? null,
    routing_number: bankDetails.routing_number ?? null,
    iban: bankDetails.iban ?? null,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: 'active',
  })

  return NextResponse.json({
    order_id: upgradeOrder.id,
    payment_reference,
    amount,
    currency,
    bank_details: bankDetails,
    target_plan_tier,
  })
}
