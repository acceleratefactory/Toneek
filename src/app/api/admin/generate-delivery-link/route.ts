import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const { order_id, region, custom_amount, custom_currency } = await request.json()

        if (!order_id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        // 1. Check order status
        const { data: order, error: orderError } = await adminClient
            .from('orders')
            .select('user_id, order_type, delivery_fee')
            .eq('id', order_id)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        if (order.order_type !== 'free_trial') {
            return NextResponse.json({ error: 'Not a free trial order' }, { status: 400 })
        }

        if (order.delivery_fee !== null && order.delivery_fee > 0) {
            return NextResponse.json({ error: 'Delivery link already generated (fee > 0)' }, { status: 400 })
        }

        // 2. Determine amount and currency
        let amount = custom_amount
        let currency = custom_currency || 'NGN'

        if (region && region !== 'custom') {
            const { data: setting, error: settingError } = await adminClient
                .from('platform_settings')
                .select('value')
                .eq('key', region)
                .single()

            if (settingError || !setting || !setting.value) {
                console.error('[generate-delivery-link] Failed to fetch region fee:', region, settingError)
                return NextResponse.json({ error: 'Invalid region or missing delivery fee setting' }, { status: 400 })
            }
            amount = parseFloat(setting.value)
            
            // Extract currency from region key, e.g., delivery_fee_ngn_lagos -> ngn -> NGN
            const parts = region.split('_')
            if (parts.length >= 3) {
                currency = parts[2].toUpperCase()
            }
        }

        if (amount === undefined || amount === null || amount <= 0 || isNaN(amount)) {
            return NextResponse.json({ error: 'Invalid delivery fee amount' }, { status: 400 })
        }

        // 3. Generate link
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
            console.error('[generate-delivery-link] Error inserting link:', error)
            return NextResponse.json({ error: 'Failed to generate delivery link', detail: error.message }, { status: 500 })
        }

        // 4. Update order
        await adminClient.from('orders').update({
            delivery_fee: amount,
            delivery_fee_currency: currency,
            delivery_region: region || 'custom'
        }).eq('id', order_id)

        // 5. Log communication
        if (order.user_id) {
            try {
                await adminClient.from('communication_logs').insert({
                    user_id: order.user_id,
                    channel: 'whatsapp',
                    message_type: 'delivery_link_sent'
                })
            } catch (e) {
                console.error('Failed to log communication:', e)
            }
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toneek.com'
        const linkUrl = `${baseUrl}/pay-delivery?token=${token}`

        return NextResponse.json({ link: linkUrl, amount, currency, token })

    } catch (err: any) {
        console.error('[generate-delivery-link] Unexpected error:', err)
        return NextResponse.json({ error: 'Unexpected server error', detail: err.message }, { status: 500 })
    }
}
