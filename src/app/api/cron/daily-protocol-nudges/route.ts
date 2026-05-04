import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = adminClient

  // Find all orders where received_at was exactly 2 days ago
  // (days_since_receipt = 2 → Day 3)
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const dateStr = twoDaysAgo.toISOString().split('T')[0]

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, user_id, routine_tier,
      profiles!inner(email, full_name, phone)
    `)
    .gte('received_at', `${dateStr}T00:00:00`)
    .lt('received_at', `${dateStr}T23:59:59`)
    .in('routine_tier', ['two_to_three', 'whatever_it_takes'])

  if (!orders || orders.length === 0) {
    return NextResponse.json({ nudges_sent: 0 })
  }

  let sent = 0

  for (const order of orders) {
    const profile = order.profiles as any
    const name = profile?.full_name?.split(' ')[0] ?? 'there'
    const is_full_routine = order.routine_tier === 'whatever_it_takes'

    const day3_message = is_full_routine
      ? `Hi ${name} — it's Day 4 of your Toneek protocol.\n\nTonight you add your Toneek formula for the first time.\n\nRoutine tonight:\n1. Cleanse\n2. Apply formula — 0.5ml, pea-sized\n3. Moisturise\n\nMild tingling is expected. It means the actives are working. Your fourth product joins tomorrow.\n\nLogin to see your full protocol: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/formula`
      : `Hi ${name} — it's Day 3 of your Toneek protocol.\n\nTonight you apply your Toneek formula for the first time.\n\nRoutine tonight:\n1. Cleanse\n2. Apply formula — 0.5ml, pea-sized\n3. Moisturise\n\nMild tingling is normal — it means the actives are working.\n\nLogin to see your full protocol: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/formula`

    // WhatsApp
    if (profile?.phone) {
      await sendWhatsApp(profile.phone, day3_message)
    }

    // Email
    if (profile?.email) {
      await sendDay3Email({
        email: profile.email,
        name,
        is_full_routine,
        base_url: process.env.NEXT_PUBLIC_BASE_URL!,
      })
    }

    sent++
  }

  return NextResponse.json({ nudges_sent: sent })
}

async function sendWhatsApp(phone: string, message: string) {
  const apiUrl = process.env.WHATSAPP_API_URL
  const apiKey = process.env.WHATSAPP_API_TOKEN
  if (!apiUrl || !apiKey) {
    console.log(`[WhatsApp to ${phone}]: ${message}`)
    return
  }
  await fetch(`${apiUrl}?phone=${phone}&apikey=${apiKey}&text=${encodeURIComponent(message)}`)
}

async function sendDay3Email({ email, name, is_full_routine, base_url }: any) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const subject = is_full_routine
      ? 'Day 4 — your Toneek formula begins tonight'
      : 'Day 3 — your Toneek formula begins tonight'

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@toneek.com',
      to: email,
      subject,
      html: `
        <div style="font-family:system-ui;max-width:560px;margin:0 auto;">
          <h2 style="color:#2A0F06;">
            ${is_full_routine ? 'Day 4' : 'Day 3'} — your formula begins tonight
          </h2>
          <p>Hi ${name},</p>
          <p>Your skin has had ${is_full_routine ? 'three' : 'two'} days to adjust to the 
          cleanser and moisturiser. Tonight, your active treatment formula enters the routine.</p>

          <div style="background:#F7F1EB;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;font-weight:600;color:#2A0F06;">Tonight's routine:</p>
            <ol style="color:#2A0F06;margin:8px 0 0 0;padding-left:20px;">
              <li>Wash with your Toneek cleanser</li>
              <li>Apply your Toneek formula — 0.5ml, pea-sized amount</li>
              <li>Apply your Toneek moisturiser</li>
            </ol>
          </div>

          <p style="color:#8C7B72;font-size:14px;">
            <strong>Mild tingling or warmth</strong> in the first application is normal 
            and expected — it is the actives making contact with your skin. It subsides 
            within a few days.
          </p>

          <p style="color:#8C7B72;font-size:14px;">
            If you experience burning or visible redness that does not fade within 
            20 minutes: stop application and complete your check-in.
          </p>

          ${is_full_routine ? `
          <div style="background:#E8F2EC;border-radius:8px;padding:12px;margin:16px 0;">
            <p style="margin:0;color:#1C5C3A;font-size:14px;">
              <strong>Tomorrow (Day 5):</strong> Your fourth product joins the morning routine.
            </p>
          </div>
          ` : ''}

          <a href="${base_url}/dashboard/formula"
             style="display:inline-block;background:#2A0F06;color:white;
                    padding:14px 28px;border-radius:8px;text-decoration:none;
                    font-weight:600;margin-top:16px;">
            View your full protocol
          </a>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send Day 3 email', error)
  }
}
