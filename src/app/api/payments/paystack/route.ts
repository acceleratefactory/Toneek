// src/app/api/payments/paystack/route.ts
// Dormant — returns 503 until PAYSTACK_SECRET_KEY is set in environment variables.
// No customer ever reaches this route unless Paystack is explicitly enabled.

import { NextResponse } from 'next/server'

export async function POST() {
    if (!process.env.PAYSTACK_SECRET_KEY) {
        return NextResponse.json(
            { error: 'Paystack is not configured on this platform.' },
            { status: 503 }
        )
    }

    // Full Paystack implementation here when key is set (Sprint 5+)
    return NextResponse.json(
        { error: 'Paystack integration not yet implemented.' },
        { status: 501 }
    )
}
