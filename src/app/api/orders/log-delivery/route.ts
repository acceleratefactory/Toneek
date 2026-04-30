import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Validate the caller is an authenticated user
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { order_id, received_date } = await request.json()

  if (!order_id || !received_date) {
    return NextResponse.json({ error: 'Missing order_id or received_date' }, { status: 400 })
  }

  const received_at = new Date(received_date).toISOString()

  // Verify the order belongs to this user before updating
  const { data: order, error: fetchError } = await adminClient
    .from('orders')
    .select('id, user_id')
    .eq('id', order_id)
    .eq('user_id', session.user.id)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
  }

  // Update order received_at — use adminClient to bypass RLS
  const { error: orderError } = await adminClient
    .from('orders')
    .update({ 
      received_at,
      status: 'delivered'
    })
    .eq('id', order_id)

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  // Update profile with formula received date
  await adminClient
    .from('profiles')
    .update({ formula_received_at: received_at })
    .eq('id', order.user_id)

  // Update subscription treatment start date
  await adminClient
    .from('subscriptions')
    .update({ treatment_start_date: received_at })
    .eq('user_id', order.user_id)
    .eq('status', 'active')

  return NextResponse.json({ success: true, received_at })
}
