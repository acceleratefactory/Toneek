// src/app/api/orders/[id]/payment-status/route.ts
// Polled every 5s by BankTransferModal after customer clicks "I've sent the money".
// Returns payment_status and order_status for the given order ID.

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!id) {
        return NextResponse.json(
            { error: 'Missing order id' },
            { status: 400 }
        )
    }

    const { data: order, error } = await adminClient
        .from('orders')
        .select('payment_status, status')
        .eq('id', id)
        .single()

    if (error || !order) {
        return NextResponse.json(
            { payment_status: 'unknown', order_status: 'unknown' },
            { status: 404 }
        )
    }

    return NextResponse.json({
        payment_status: order.payment_status,
        order_status:   order.status,
    })
}
