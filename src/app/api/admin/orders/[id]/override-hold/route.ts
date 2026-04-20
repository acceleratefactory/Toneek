import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    // Update order status from held_for_checkin to pending_dispatch
    // and generate a tracking number automatically for the holding override.
    const tracking = `TNK-${uuidv4().split('-')[0].toUpperCase()}`

    const { error } = await adminClient
      .from('orders')
      .update({
        status: 'pending_dispatch',
        dispatch_held_reason: null, // clear the hold
        tracking_number: tracking
      })
      .eq('id', id)
      .eq('status', 'held_for_checkin') // safely only clear if it really was held

    if (error) {
       console.error('Hold override error:', error)
       return NextResponse.redirect(new URL('/admin/orders?error=db_error', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
    }

    return NextResponse.redirect(new URL('/admin/orders?success=hold_overridden', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  } catch (err) {
    console.error('Hold override endpoint error:', err)
    return NextResponse.redirect(new URL('/admin/orders?error=server_error', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  }
}
