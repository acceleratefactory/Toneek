import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST() {
  // Get all orders in payment_confirmed, pending_formulation, or pending_production status
  const { data: rawOrders } = await adminClient
    .from('orders')
    .select('id, status, user_id, payment_reference, created_at')
    .in('status', ['payment_confirmed', 'pending_formulation', 'pending_production'])
    .order('created_at', { ascending: true })

  if (!rawOrders || rawOrders.length === 0) {
    return NextResponse.redirect(new URL('/admin/production?error=no_orders', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  }

  // Enrich each order with the correct formula code by checking the user's latest assessment
  const orders = await Promise.all(rawOrders.map(async (order: any) => {
    let formula_code = 'UNKNOWN'
    if (order.user_id) {
       const { data: assessment } = await adminClient
         .from('skin_assessments')
         .select('formula_code')
         .eq('user_id', order.user_id)
         .order('created_at', { ascending: false })
         .limit(1)
         .maybeSingle()
       if (assessment?.formula_code) formula_code = assessment.formula_code
    }
    return { ...order, formula_code }
  }))

  // Group by formula_code
  const grouped = orders.reduce((acc: Record<string, any[]>, order: any) => {
    const code = order.formula_code
    if (!acc[code]) acc[code] = []
    acc[code].push(order)
    return acc
  }, {})

  // Generate batch instructions per formula code
  const batches = []

  for (const [formula_code, formulaOrders] of Object.entries(grouped)) {
    const units = formulaOrders.length

    // Get production spec for this formula
    const { data: spec } = await adminClient
      .from('formula_production_specs')
      .select('*')
      .eq('formula_code', formula_code)
      .single()

    if (!spec) {
      batches.push({
        formula_code,
        units,
        warning: 'No production spec found — manual calculation required',
        order_ids: formulaOrders.map((o: any) => o.id),
      })
      continue
    }

    // Calculate ingredient quantities for this batch
    // Each unit = 100g formula
    const total_grams = units * 100
    const ingredients = spec.active_modules?.map((active: any) => ({
      name: active.name,
      concentration_pct: active.concentration_pct,
      grams_total: (active.concentration_pct / 100) * total_grams,
      ml_total: (active.concentration_pct / 100) * total_grams, // 1g ≈ 1ml for these formulas
    })) ?? []

    // Add base formula quantity
    const actives_total_pct = ingredients.reduce(
      (sum: number, i: any) => sum + i.concentration_pct, 0
    )
    const base_pct = 100 - actives_total_pct - 2 // 2% preservative allowance
    const base_grams = (base_pct / 100) * total_grams

    batches.push({
      formula_code,
      units,
      total_grams,
      base_grams: Math.round(base_grams * 10) / 10,
      ingredients: ingredients.map((i: any) => ({
        ...i,
        grams_total: Math.round(i.grams_total * 10) / 10,
      })),
      order_ids: formulaOrders.map((o: any) => o.id),
    })
  }

  // Create production_queue record
  const { data: productionRun, error } = await adminClient
    .from('production_queue')
    .insert({
      production_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      batches,
      total_orders_covered: orders.length,
      triggered_automatically: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Queue generation error:', error)
    return NextResponse.redirect(new URL('/admin/production?error=db_error', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  }

  // Update order statuses
  await adminClient
    .from('orders')
    .update({ status: 'in_production' })
    .in('id', orders.map(o => o.id))

  // Redirect back to the production queue page on success
  return NextResponse.redirect(new URL('/admin/production?success=true', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}
