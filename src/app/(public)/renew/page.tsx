// src/app/(public)/renew/page.tsx
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import BankTransferModal from '@/components/payment/BankTransferModal'
import crypto from 'crypto'
import { getPlanPrice, getBankDetails } from '@/lib/orders/pricing'
import Link from 'next/link'

interface RenewPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function RenewPage({ searchParams }: RenewPageProps) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Validate the token
  const { data: renewalToken, error } = await supabase
    .from('renewal_tokens')
    .select('*')
    .eq('token', token)
    .single()

  // Token not found
  if (error || !renewalToken) {
    return <InvalidTokenPage message="This renewal link is invalid or has expired." />
  }

  // Token expired
  if (new Date(renewalToken.expires_at) < new Date()) {
    return (
      <InvalidTokenPage 
        message="This renewal link has expired. Please log in to your dashboard to renew."
        show_login_button={true}
      />
    )
  }

  // Token already used — order exists
  if (renewalToken.used_at && renewalToken.order_id) {
    // Show the existing bank transfer details so they can check status
    const { data: existingOrder } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', renewalToken.order_id)
      .single()

    if (existingOrder?.payment_status === 'confirmed') {
      return <AlreadyRenewedPage />
    }
    // Payment still pending — fall through to the bank transfer display
  }

  // Create the renewal order if not already created
  let order_id = renewalToken.order_id
  let bank_details
  let payment_reference
  let amount
  let currency = renewalToken.currency

  if (!order_id) {
    // Create new order using same logic as /api/orders/create
    const random = Math.floor(1000 + Math.random() * 9000)
    payment_reference = `TNOK-${Date.now()}-${random}`

    amount = await getPlanPrice(renewalToken.plan_tier, currency)

    const confirm_token = `${crypto.randomUUID()}-${crypto.randomUUID()}`

    const { data: newOrder } = await adminClient
      .from('orders')
      .insert({
        user_id: renewalToken.user_id,
        plan_tier: renewalToken.plan_tier,
        payment_amount: amount,
        currency,
        payment_method: 'bank_transfer',
        payment_status: 'pending',
        payment_reference,
        payment_confirm_token: confirm_token,
        payment_token_used: false,
        status: 'pending_payment',
        order_type: 'renewal',
      })
      .select()
      .single()

    order_id = newOrder?.id

    // Mark the renewal token as used
    await adminClient
      .from('renewal_tokens')
      .update({
        used_at: new Date().toISOString(),
        order_id,
      })
      .eq('id', renewalToken.id)

    // Create the bank transfer session
    bank_details = getBankDetails(currency)
    await adminClient.from('bank_transfer_sessions').insert({
      order_id,
      user_id: renewalToken.user_id,
      payment_reference,
      amount,
      currency,
      bank_name: bank_details.bank_name ?? null,
      account_name: bank_details.account_name ?? null,
      account_number: bank_details.account_number ?? null,
      sort_code: bank_details.sort_code ?? null,
      routing_number: bank_details.routing_number ?? null,
      iban: bank_details.iban ?? null,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: 'active',
    })

  } else {
    // Order exists — fetch existing details
    const { data: existingOrder } = await adminClient
      .from('orders')
      .select('payment_reference, payment_amount, currency')
      .eq('id', order_id)
      .single()

    payment_reference = existingOrder?.payment_reference
    amount = existingOrder?.payment_amount
    bank_details = getBankDetails(currency)
  }

  // Get customer name for personalisation
  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name')
    .eq('id', renewalToken.user_id)
    .single()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F1EB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ color: '#C87D3E', fontSize: '28px', margin: '0 0 8px 0', fontFamily: 'serif' }}>toneek</h1>
        <p style={{ color: '#8C7B72', fontSize: '14px', margin: '0' }}>
          Formula renewal for {profile?.full_name?.split(' ')[0] ?? 'your account'}
        </p>
      </div>

      {/* The existing BankTransferModal — no changes to the component */}
      <BankTransferModal
        orderId={order_id}
        amount={amount}
        currency={currency}
        paymentReference={payment_reference}
        bankDetails={bank_details}
        onClose={() => {}}
        isRenewal={true}
      />
    </div>
  )
}

function InvalidTokenPage({ message, show_login_button }: { message: string, show_login_button?: boolean }) {
  return (
    <div className="min-h-screen bg-[#F7F1EB] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h2 className="text-[#DC2626] text-2xl font-bold mb-4">Link Invalid</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {show_login_button && (
          <Link 
            href="/login" 
            className="inline-block w-full bg-[#1A1210] text-white py-4 rounded-xl font-bold text-sm"
          >
            Log in to Dashboard
          </Link>
        )}
      </div>
    </div>
  )
}

function AlreadyRenewedPage() {
  return (
    <div className="min-h-screen bg-[#F7F1EB] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-[#059669] text-2xl font-bold mb-4">Already Renewed</h2>
        <p className="text-gray-600 mb-6">Your payment has already been confirmed and your formula is currently being prepared.</p>
        <Link 
          href="/dashboard" 
          className="inline-block w-full bg-[#1A1210] text-white py-4 rounded-xl font-bold text-sm"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
