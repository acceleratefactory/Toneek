import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { order_id, received_date } = await request.json()

  const received_at = new Date(received_date).toISOString()

  // Update order
  const { error: orderError } = await supabase
    .from('orders')
    .update({ 
      received_at,
      status: 'delivered'
    })
    .eq('id', order_id)

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // Get user_id from order
  const { data: order } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', order_id)
    .single()

  if (order?.user_id) {
    // Update profile with formula received date
    await supabase
      .from('profiles')
      .update({ formula_received_at: received_at })
      .eq('id', order.user_id)

    // Also update subscription anchor date
    await supabase
      .from('subscriptions')
      .update({ treatment_start_date: received_at })
      .eq('user_id', order.user_id)
      .eq('status', 'active')
  }

  return NextResponse.json({ success: true, received_at })
}
