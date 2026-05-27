import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { user_id, address, city, state } = await request.json()

        if (!user_id || !address || !city || !state) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { error } = await adminClient
            .from('profiles')
            .update({ address, city, state })
            .eq('id', user_id)

        if (error) {
            console.error('[save-delivery-address] Error updating profile:', error)
            return NextResponse.json({ error: 'Failed to save address' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[save-delivery-address] Unexpected error:', err)
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
    }
}
