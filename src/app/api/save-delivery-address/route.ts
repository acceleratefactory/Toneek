import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { user_id, order_id, address, city, state, deliveryRegion, deliveryFee, currency } = await request.json()

        if (!user_id || !address || !city || !state) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ address, city, state })
            .eq('id', user_id)

        if (profileError) {
            console.error('[save-delivery-address] Error updating profile:', profileError)
            return NextResponse.json({ error: 'Failed to save address' }, { status: 500 })
        }
        
        if (order_id && deliveryRegion && deliveryFee !== undefined && currency) {
            await adminClient.from('orders').update({
                delivery_fee: deliveryFee,
                delivery_fee_currency: currency,
                delivery_region: deliveryRegion
            }).eq('id', order_id)
            
            await adminClient.from('delivery_payment_links').update({
                delivery_fee: deliveryFee,
                currency: currency,
                delivery_region: deliveryRegion
            }).eq('order_id', order_id)
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[save-delivery-address] Unexpected error:', err)
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
    }
}
