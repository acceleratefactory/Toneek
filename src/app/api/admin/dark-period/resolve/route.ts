import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('dark_period_responses')
      .update({ admin_alert_dismissed: true })
      .eq('id', id)

    if (error) {
      console.error('Failed to resolve alert:', error)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error resolving dark period alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
