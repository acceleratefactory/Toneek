import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { sendDispatchEmail } from '@/lib/email/sendDispatchEmail'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    
    // Parse form data to get the manually pasted tracking number
    const formData = await request.formData()
    const tracking = formData.get('tracking')?.toString()

    if (!tracking) {
       return NextResponse.redirect(new URL('/admin/orders?error=missing_tracking_number', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
    }

    // Update order status to dispatched
    const { error } = await adminClient
      .from('orders')
      .update({
        status: 'dispatched',
        tracking_number: tracking,
        dispatched_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
       console.error('Dispatch update error:', error)
       return NextResponse.redirect(new URL('/admin/orders?error=db_error', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
    }

    // ── Fetch customer details and fire dispatch email ──
    try {
      const { data: order } = await adminClient.from('orders').select('user_id, payment_reference').eq('id', id).single()
      
      let customerEmail = null
      let customerName = 'there'

      if (order?.user_id) {
        const { data: profile } = await adminClient.from('profiles').select('email, full_name').eq('id', order.user_id).single()
        customerEmail = profile?.email
        customerName = profile?.full_name?.split(' ')[0] || 'there'
      }

      if (customerEmail) {
        await sendDispatchEmail({
          email: customerEmail,
          customerName,
          trackingNumber: tracking,
          orderReference: order?.payment_reference || id,
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        })
      }
    } catch (emailErr) {
      console.error('Failed to send dispatch email (non-fatal):', emailErr)
    }

    return NextResponse.redirect(new URL('/admin/orders?success=dispatched', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  } catch (err) {
    console.error('Dispatch endpoint error:', err)
    return NextResponse.redirect(new URL('/admin/orders?error=server_error', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  }
}
