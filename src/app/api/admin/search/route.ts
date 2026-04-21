import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  const cleanQuery = query.trim()

  // 1. Search Customers
  const { data: users } = await adminClient
    .from('profiles')
    .select('id, full_name, email')
    .or(`full_name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%`)
    .limit(5)

  // 2. Search Orders
  const { data: orders } = await adminClient
    .from('orders')
    .select('id, payment_reference, status, plan_tier')
    .ilike('payment_reference', `%${cleanQuery}%`)
    .limit(5)

  const results: any[] = []

  if (users) {
     users.forEach(u => results.push({ 
       type: 'customer', 
       title: u.full_name || 'Unnamed Customer', 
       secondary: u.email, 
       url: `/admin/customers` // simplified URL since we aren't building a deep-link feature yet
     }))
  }
  
  if (orders) {
     orders.forEach(o => results.push({ 
       type: 'order', 
       title: o.payment_reference, 
       secondary: `Status: ${o.status.toUpperCase()} · Tier: ${o.plan_tier}`, 
       url: `/admin/orders` 
     }))
  }

  return NextResponse.json({ results })
}
