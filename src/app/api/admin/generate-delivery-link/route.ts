import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const { order_id, region, custom_amount, custom_currency } = await request.json()

        if (!order_id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }
        if (!region && custom_amount === undefined) {
            return NextResponse.json({ error: 'Region or custom amount is required' }, { status: 400 })
        }

        let amount = custom_amount
        let currency = custom_currency || 'NGN'

        if (region && region !== 'custom') {
            const { data: settings } = await adminClient
                .from('platform_settings')
                .select('delivery_fees')
                .single()

            if (!settings || !settings.delivery_fees || !settings.delivery_fees[region]) {
                return NextResponse.json({ error: 'Invalid region or missing delivery fee setting' }, { status: 400 })
            }
            amount = settings.delivery_fees[region].amount
            currency = settings.delivery_fees[region].currency
        }

        if (amount === undefined || amount === null || amount <= 0) {
            return NextResponse.json({ error: 'Invalid delivery fee amount' }, { status: 400 })
        }

        const token = crypto.randomBytes(16).toString('hex')

        const { data: link, error } = await adminClient
            .from('delivery_payment_links')
            .insert({
                order_id,
                token,
                amount,
                currency,
                region: region || 'custom',
            })
            .select()
            .single()

        if (error) {
            console.error('Error generating delivery link:', error)
            return NextResponse.json({ error: 'Failed to generate delivery link' }, { status: 500 })
        }

        // Update the order with delivery info
        await adminClient.from('orders').update({
            delivery_fee: amount,
            delivery_fee_currency: currency,
            delivery_region: region || 'custom'
        }).eq('id', order_id)

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toneek.com'
        const linkUrl = `${baseUrl}/pay-delivery?token=${token}`

        return NextResponse.json({ link: linkUrl, amount, currency, token })

    } catch (err: any) {
        console.error('Unexpected error generating delivery link:', err)
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
    }
}
