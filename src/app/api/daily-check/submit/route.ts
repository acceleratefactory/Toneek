import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { day, response } = await request.json()

    if (![1, 3, 5].includes(day)) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 })
    }

    if (!['happy', 'neutral', 'concerned'].includes(response)) {
      return NextResponse.json({ error: 'Invalid response' }, { status: 400 })
    }

    // Check for existing
    const { data: existing } = await adminClient
      .from('dark_period_responses')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('day_number', day)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already recorded' })
    }

    // Insert response
    await adminClient.from('dark_period_responses').insert({
      user_id: session.user.id,
      day_number: day,
      response,
      response_channel: 'dashboard',
      admin_alerted: response === 'concerned'
    })

    // Alert admin via WhatsApp and Email if concerned
    if (response === 'concerned') {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name, phone, email')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        // WhatsApp Alert
        if (process.env.ADMIN_WHATSAPP_NUMBER) {
          const adminUrl = process.env.WHATSAPP_API_URL
          const adminKey = process.env.WHATSAPP_API_TOKEN
          if (adminUrl && adminKey) {
            const alertMessage = `🚨 Dark Period Alert (Day ${day})\nCustomer: ${profile.full_name}\nPhone: ${profile.phone}\nStatus: Concerned (Dashboard)`
            await fetch(`${adminUrl}?phone=${process.env.ADMIN_WHATSAPP_NUMBER}&apikey=${adminKey}&text=${encodeURIComponent(alertMessage)}`)
          }
        }

        // Email Alert
        if (process.env.ADMIN_EMAIL && process.env.RESEND_API_KEY) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY)
            await resend.emails.send({
              from: process.env.FROM_EMAIL || 'alerts@toneek.com',
              to: process.env.ADMIN_EMAIL,
              subject: `🚨 Dark Period Alert (Day ${day}) - ${profile.full_name}`,
              html: `
                <h2>Early Reaction Alert</h2>
                <p><strong>Customer:</strong> ${profile.full_name}</p>
                <p><strong>Email:</strong> ${profile.email}</p>
                <p><strong>Phone:</strong> ${profile.phone || 'N/A'}</p>
                <p><strong>Day:</strong> ${day}</p>
                <p><strong>Status:</strong> Concerned (Submitted via Dashboard)</p>
                <p>Please review their profile in the admin dashboard and reach out immediately.</p>
              `
            })
          } catch (e) {
            console.error('Failed to send admin email alert:', e)
          }
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in daily check submit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
