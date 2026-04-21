import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { id, prices } = await request.json()
    
    if (!id || !prices) {
      return NextResponse.json({ error: 'Missing mandatory payload variables' }, { status: 400 })
    }

    // Direct UPDATE mapping over the exact matched subscription tier identity
    const { error } = await adminClient
      .from('subscription_tiers')
      .update({ prices })
      .eq('id', id)

    if (error) {
       console.error("Database Error whilst writing pricing override:", error)
       throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Pricing infrastructure update failed' }, { status: 500 })
  }
}
