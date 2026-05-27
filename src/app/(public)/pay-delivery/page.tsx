import { adminClient } from '@/lib/supabase/admin'
import { getBankDetails } from '@/lib/orders/pricing'
import PayDeliveryClient from './PayDeliveryClient'

export const dynamic = 'force-dynamic'

export default async function PayDeliveryPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const resolvedParams = await searchParams
  const token = resolvedParams.token

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8] p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-[#E8E0DA] max-w-md">
          <p className="text-2xl mb-4">⚠️</p>
          <h1 className="text-[#3D1A0E] text-xl font-bold mb-2">Invalid Link</h1>
          <p className="text-[#8B7365] text-sm">This delivery payment link is invalid or missing.</p>
        </div>
      </div>
    )
  }

  // Find the token
  const { data: linkRecord } = await adminClient
    .from('delivery_payment_links')
    .select('*')
    .eq('token', token)
    .single()

  if (!linkRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8] p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-[#E8E0DA] max-w-md">
          <p className="text-2xl mb-4">🚫</p>
          <h1 className="text-[#3D1A0E] text-xl font-bold mb-2">Link Not Found</h1>
          <p className="text-[#8B7365] text-sm">We couldn't find a valid delivery request for this link.</p>
        </div>
      </div>
    )
  }

  if (linkRecord.used_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8] p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-[#E8E0DA] max-w-md">
          <p className="text-2xl mb-4">✅</p>
          <h1 className="text-[#3D1A0E] text-xl font-bold mb-2">Payment Already Processed</h1>
          <p className="text-[#8B7365] text-sm">This delivery fee has already been paid. Your formula is currently being prepared for dispatch.</p>
        </div>
      </div>
    )
  }

  // Fetch the order
  const { data: order } = await adminClient
    .from('orders')
    .select('*')
    .eq('id', linkRecord.order_id)
    .single()

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8] p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-[#E8E0DA] max-w-md">
          <p className="text-2xl mb-4">🚫</p>
          <h1 className="text-[#3D1A0E] text-xl font-bold mb-2">Order Not Found</h1>
          <p className="text-[#8B7365] text-sm">The order associated with this link could not be found.</p>
        </div>
      </div>
    )
  }

  // Fetch customer profile
  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, address, city, state')
    .eq('id', order.user_id)
    .single()

  // Fetch assessment for formula code
  const { data: assessment } = await adminClient
    .from('skin_assessments')
    .select('formula_code')
    .eq('user_id', order.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const bankDetails = getBankDetails(linkRecord.currency)

  return (
    <div className="min-h-screen bg-[#FCFAF8] p-4">
      <PayDeliveryClient
        orderId={order.id}
        userId={order.user_id}
        amount={linkRecord.amount}
        currency={linkRecord.currency}
        paymentReference={order.payment_reference}
        bankDetails={bankDetails}
        customerName={profile?.full_name || 'Customer'}
        formulaCode={assessment?.formula_code || 'Pending'}
        planTier={order.plan_tier || 'essentials'}
        initialAddress={{
          address: profile?.address || '',
          city: profile?.city || '',
          state: profile?.state || ''
        }}
      />
    </div>
  )
}
