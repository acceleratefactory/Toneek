import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = adminClient

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Day 3 (received 2 days ago)
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const dateStr = twoDaysAgo.toISOString().split('T')[0]

  // Day 5 (received 4 days ago)
  const fourDaysAgo = new Date()
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
  const day5Str = fourDaysAgo.toISOString().split('T')[0]

  const { data: day3Orders } = await supabase
    .from('orders')
    .select(`
      id, user_id, routine_tier,
      profiles!inner(email, full_name, phone)
    `)
    .gte('received_at', `${dateStr}T00:00:00`)
    .lt('received_at', `${dateStr}T23:59:59`)
    .in('routine_tier', ['two_to_three', 'whatever_it_takes'])

  let sent = 0

  for (const order of day3Orders ?? []) {
    const profile = order.profiles as any
    const name = profile?.full_name?.split(' ')[0] ?? 'there'
    const is_full_routine = order.routine_tier === 'whatever_it_takes'

    const darkPeriodPrompt = `\n\nHow is your skin feeling today?\n\nReply:\n😊 Happy — all good\n😐 Neutral — not sure yet\n😟 Concerned — something feels off\n\nOr log it here: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/daily-check?day=3`

    const day3_message = is_full_routine
      ? `Hi ${name} — it's Day 4 of your Toneek protocol.\n\nTonight you add your Toneek formula for the first time.\n\nRoutine tonight:\n1. Cleanse\n2. Apply formula — 0.5ml, pea-sized\n3. Moisturise\n\nMild tingling is expected. It means the actives are working. Your fourth product joins tomorrow.\n\nLogin to see your full protocol: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/formula${darkPeriodPrompt}`
      : `Hi ${name} — it's Day 3 of your Toneek protocol.\n\nTonight you apply your Toneek formula for the first time.\n\nRoutine tonight:\n1. Cleanse\n2. Apply formula — 0.5ml, pea-sized\n3. Moisturise\n\nMild tingling is normal — it means the actives are working.\n\nLogin to see your full protocol: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/formula${darkPeriodPrompt}`

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

  // --- DAY 1 (Received Today) ---
  const { data: day1Orders } = await supabase
    .from('orders')
    .select(`id, user_id, profiles!inner(phone, full_name)`)
    .gte('received_at', `${todayStr}T00:00:00`)
    .lt('received_at', `${todayStr}T23:59:59`)
    .eq('status', 'delivered')
    .not('routine_tier', 'eq', 'just_one')

  for (const order of day1Orders ?? []) {
    const { data: existing } = await supabase
      .from('dark_period_responses')
      .select('id')
      .eq('user_id', order.user_id)
      .eq('day_number', 1)
      .single()
    
    if (existing) continue

    const profile = order.profiles as any
    const name = profile?.full_name?.split(' ')[0] ?? 'there'
    
    const day1_message = 
      `Hi ${name} — Day 1 with your Toneek protocol.\n\n` +
      `How is your skin feeling today?\n\n` +
      `Reply:\n` +
      `😊 Happy — all good\n` +
      `😐 Neutral — not sure yet\n` +
      `😟 Concerned — something feels off\n\n` +
      `Or log it here: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/daily-check?day=1`

    if (profile?.phone) {
      await sendWhatsApp(profile.phone, day1_message)
      sent++
    }

    if (profile?.email) {
      await sendDay1Email({
        email: profile.email,
        name,
        base_url: process.env.NEXT_PUBLIC_BASE_URL!,
      })
    }
  }

  // --- DAY 5 (Received 4 days ago) ---
  const { data: day5Orders } = await supabase
    .from('orders')
    .select(`id, user_id, profiles!inner(phone, full_name)`)
    .gte('received_at', `${day5Str}T00:00:00`)
    .lt('received_at', `${day5Str}T23:59:59`)
    .eq('status', 'delivered')
    .not('routine_tier', 'eq', 'just_one')

  for (const order of day5Orders ?? []) {
    const { data: existing } = await supabase
      .from('dark_period_responses')
      .select('id')
      .eq('user_id', order.user_id)
      .eq('day_number', 5)
      .single()
    
    if (existing) continue

    const profile = order.profiles as any
    const name = profile?.full_name?.split(' ')[0] ?? 'there'
    
    const day5_message = 
      `Hi ${name} — Day 5 with your Toneek protocol.\n\n` +
      `How is your skin feeling today?\n\n` +
      `Reply:\n` +
      `😊 Happy — all good\n` +
      `😐 Neutral — not sure yet\n` +
      `😟 Concerned — something feels off\n\n` +
      `Or log it here: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/daily-check?day=5`

    if (profile?.phone) {
      await sendWhatsApp(profile.phone, day5_message)
      sent++
    }

    if (profile?.email) {
      await sendDay5Email({
        email: profile.email,
        name,
        base_url: process.env.NEXT_PUBLIC_BASE_URL!,
      })
    }
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

          <div style="margin-top:24px;border-top:1px solid #E5E7EB;padding-top:24px;">
            <p style="color:#2A0F06;font-weight:600;margin-bottom:12px;">Quick Check-in:</p>
            <p>How is your skin feeling today?</p>
            <a href="${base_url}/dashboard/daily-check?day=3"
               style="display:inline-block;background:#2A0F06;color:white;
                      padding:12px 24px;border-radius:8px;text-decoration:none;
                      font-weight:600;margin-top:8px;">
              Log your response
            </a>
          </div>

          <div style="margin-top:16px;">
            <a href="${base_url}/dashboard/formula"
               style="display:inline-block;color:#8C7B72;text-decoration:underline;
                      font-size:14px;">
              View your full protocol
            </a>
          </div>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send Day 3 email', error)
  }
}

async function sendDay1Email({ email, name, base_url }: any) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@toneek.com',
      to: email,
      subject: 'Day 1 — Quick Check-in',
      html: `
        <div style="font-family:system-ui;max-width:560px;margin:0 auto;">
          <h2 style="color:#2A0F06;">Day 1 Check-in</h2>
          <p>Hi ${name},</p>
          <p>Your Toneek protocol has begun. We check in closely during the first few days to ensure your skin is adapting well.</p>
          
          <div style="margin-top:24px;background:#F7F1EB;border-radius:8px;padding:16px;">
            <p style="color:#2A0F06;font-weight:600;margin-top:0;margin-bottom:12px;">How is your skin feeling today?</p>
            <a href="${base_url}/dashboard/daily-check?day=1"
               style="display:inline-block;background:#2A0F06;color:white;
                      padding:12px 24px;border-radius:8px;text-decoration:none;
                      font-weight:600;">
              Log your response
            </a>
          </div>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send Day 1 email', error)
  }
}

async function sendDay5Email({ email, name, base_url }: any) {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'notifications@toneek.com',
      to: email,
      subject: 'Day 5 — Quick Check-in',
      html: `
        <div style="font-family:system-ui;max-width:560px;margin:0 auto;">
          <h2 style="color:#2A0F06;">Day 5 Check-in</h2>
          <p>Hi ${name},</p>
          <p>You've made it to Day 5 of your Toneek protocol. The active ingredients are starting to work beneath the surface.</p>
          
          <div style="margin-top:24px;background:#F7F1EB;border-radius:8px;padding:16px;">
            <p style="color:#2A0F06;font-weight:600;margin-top:0;margin-bottom:12px;">How is your skin feeling today?</p>
            <a href="${base_url}/dashboard/daily-check?day=5"
               style="display:inline-block;background:#2A0F06;color:white;
                      padding:12px 24px;border-radius:8px;text-decoration:none;
                      font-weight:600;">
              Log your response
            </a>
          </div>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send Day 5 email', error)
  }
}
