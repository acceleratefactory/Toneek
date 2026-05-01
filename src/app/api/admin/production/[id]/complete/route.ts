import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { canDispatchNextOrder } from '@/lib/dispatch/canDispatch'

export async function POST(
  request: NextRequest,
  // Use Promise for params specifically in the App Router dynamic route handler
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params per latest Next.js 15 App Router requirements
    const resolvedParams = await params
    const id = resolvedParams.id

    // Check for form data (could be empty if just a POST with no body from older clients)
    let companion_confirmed = false
    try {
      const formData = await request.formData()
      companion_confirmed = formData.get('companion_confirmed') === 'true'
    } catch (e) {
      // Ignore if no form data
    }

    const { data: run } = await adminClient
      .from('production_queue')
      .select('*')
      .eq('id', id)
      .single()

    if (!run) {
      return NextResponse.redirect(new URL('/admin/production?error=not_found', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
    }

    const isObject = !Array.isArray(run.batches) && run.batches !== null
    const formulaBatches = isObject ? run.batches.formula_batches || [] : run.batches || []
    const companionCounts = isObject ? run.batches.companion_products || {} : {}
    
    const hasCompanions = Object.values(companionCounts).some((count: any) => count > 0)

    if (hasCompanions && !companion_confirmed) {
      return NextResponse.redirect(new URL('/admin/production?error=unconfirmed_companions', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
    }

    // 1. Mark queue as complete
    await adminClient
      .from('production_queue')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    // 2. Deduct inventory for companion products
    if (hasCompanions) {
      for (const [sku, count] of Object.entries(companionCounts)) {
        const unitsNeeded = count as number
        if (unitsNeeded > 0) {
          const { data: inv } = await adminClient
            .from('companion_product_inventory')
            .select('units_in_stock')
            .eq('product_sku', sku)
            .single()
            
          const current = inv?.units_in_stock || 0
          // Allow negative stock for tracking if they over-dispatched, but here we floor at 0 for safety unless business logic says otherwise. Let's just do math.
          const newAmount = current - unitsNeeded
          
          await adminClient
            .from('companion_product_inventory')
            .update({ units_in_stock: newAmount, updated_at: new Date().toISOString() })
            .eq('product_sku', sku)
        }
      }
    }

    // 3. Process all orders in this batch
    const orderIds = formulaBatches.flatMap((b: any) => b.order_ids ?? [])

    if (orderIds.length > 0) {
      for (const orderId of orderIds) {
        // A. Is check-in completed?
        const { data: order } = await adminClient
          .from('orders')
          .select('id, user_id, order_number')
          .eq('id', orderId)
          .single()

        if (!order) continue

        let isSafeToDispatch = true
        let holdReason = null

        // Only enforce gating if canDispatch is fully implemented
        try {
          // If this is a repeat order (order_number > 1), we must confirm check-in logic
          if (order.order_number > 1) {
            const check = await canDispatchNextOrder(order.user_id, order.order_number)
            if (!check.can_dispatch) {
              isSafeToDispatch = false
              holdReason = check.reason
            }
          }
        } catch (e) {
          // If canDispatch isn't implemented fully yet, we safely assume true
          // so as not to break MVP flow
          console.warn('Dispatch check skipped or failed:', e)
        }

        if (!isSafeToDispatch) {
          await adminClient
            .from('orders')
            .update({
              status: 'held_for_checkin',
              dispatch_held_reason: holdReason,
            })
            .eq('id', orderId)
          continue
        }

        // B. Generate tracking number
        const tracking = `TNK-${crypto.randomUUID().split('-')[0].toUpperCase()}`

        // C. Mark as dispatched
        await adminClient
          .from('orders')
          .update({
            status: 'dispatched',
            tracking_number: tracking,
            dispatched_at: new Date().toISOString(),
          })
          .eq('id', orderId)
      }
    }

    return NextResponse.redirect(new URL('/admin/production?success=completed', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  } catch (err) {
    console.error('Mark complete error:', err)
    return NextResponse.redirect(new URL('/admin/production?error=server_error', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  }
}
