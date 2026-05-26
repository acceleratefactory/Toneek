import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendRenewalEmail } from '@/lib/email/sendRenewalEmail'
import { getPlanPriceFromDB } from '@/lib/orders/pricing'

// Dummy WhatsApp sender placeholder
async function sendWhatsApp(phone: string, message: string) {
  console.log(`[WhatsApp -> ${phone}]: ${message}`)
}

export async function GET(request: Request) {
  // Verify Vercel Cron Secret
  if (process.env.CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Find active subscriptions billing in 7 days
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const dateStr = sevenDaysFromNow.toISOString().split('T')[0]

  const { data: subscriptions } = await adminClient
    .from('subscriptions')
    .select(`
      id, user_id, plan_tier, status, next_billing_date, trial_ends_at,
      profiles!inner(email, full_name, phone)
    `)
    .in('status', ['active', 'trial'])
    .or(`and(next_billing_date.gte.${dateStr}T00:00:00,next_billing_date.lt.${dateStr}T23:59:59),and(trial_ends_at.gte.${dateStr}T00:00:00,trial_ends_at.lt.${dateStr}T23:59:59)`)

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const sub of subscriptions) {
    const profile = sub.profiles as any
    const isTrial = sub.status === 'trial'
    const billing_date = isTrial ? sub.trial_ends_at : sub.next_billing_date

    // Get customer's currency from their latest order
    const { data: latestOrder } = await adminClient
      .from('orders')
      .select('currency, payment_amount, routine_tier')
      .eq('user_id', sub.user_id)
      .eq('payment_status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const currency = latestOrder?.currency ?? 'NGN'
    const routine_tier = latestOrder?.routine_tier ?? 'just_one'
    const amount = await getPlanPriceFromDB(sub.plan_tier, currency, routine_tier, adminClient)

    // Generate signed renewal token — valid for 10 days
    const token = crypto.randomBytes(32).toString('hex')
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + 10)

    // Save token to database
    await adminClient.from('renewal_tokens').insert({
      user_id: sub.user_id,
      token,
      subscription_id: sub.id,
      plan_tier: sub.plan_tier,
      currency,
      expires_at: expires_at.toISOString(),
    })

    // Build renewal URL
    const renewal_url = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/renew?token=${token}`

    const customer_name = profile?.full_name?.split(' ')[0] ?? 'there'
    const plan_display = sub.plan_tier
      .replace('_', ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase())

    // Send renewal email
    if (profile?.email) {
      await sendRenewalEmail({
        email: profile.email,
        name: customer_name,
        plan: plan_display,
        currency,
        amount,
        renewal_url,
        billing_date: billing_date,
        isTrial
      })
    }

    // Send renewal WhatsApp
    if (profile?.phone) {
      const waText = isTrial
        ? `Hi ${customer_name} — your free Toneek trial ends in 7 days.\n\nKeep your protocol going. Click to generate your payment details instantly:\n${renewal_url}\n\nOne click. No login required.`
        : `Hi ${customer_name} — your Toneek ${plan_display} renews in 7 days.\n\nClick to generate your payment details instantly:\n${renewal_url}\n\nOne click. No login required.`

      await sendWhatsApp(
        profile.phone,
        waText
      )
    }

    sent++
  }

  return NextResponse.json({ sent })
}
