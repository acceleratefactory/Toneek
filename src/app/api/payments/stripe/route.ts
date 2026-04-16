// src/app/api/payments/stripe/route.ts
// Dormant — returns 503 until STRIPE_SECRET_KEY is set in environment variables.
// No customer ever reaches this route unless Stripe is explicitly enabled.

import { NextResponse } from 'next/server'

export async function POST() {
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
            { error: 'Stripe is not configured on this platform.' },
            { status: 503 }
        )
    }

    // Full Stripe implementation here when key is set (Sprint 5+)
    return NextResponse.json(
        { error: 'Stripe integration not yet implemented.' },
        { status: 501 }
    )
}
