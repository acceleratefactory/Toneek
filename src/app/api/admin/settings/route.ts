import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Using service role client since this is an admin route that needs to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  const { data: settings, error } = await supabaseAdmin
    .from('platform_settings')
    .select('key, value')
    .like('key', 'delivery_fee_%')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const fees: Record<string, number> = {}
  for (const s of settings ?? []) {
    fees[s.key] = parseFloat(s.value)
  }

  return NextResponse.json({ fees })
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json()
    
    const allowed_keys = [
      'delivery_fee_ngn_lagos',
      'delivery_fee_ngn_outside_lagos',
      'delivery_fee_ngn_international',
      'delivery_fee_gbp_uk',
      'delivery_fee_usd_usa',
      'delivery_fee_eur_europe',
      'delivery_fee_ghs_ghana',
    ]
    
    if (!allowed_keys.includes(key)) {
      return NextResponse.json({ error: 'Key not allowed' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('platform_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) {
      console.error('Error updating platform setting:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
