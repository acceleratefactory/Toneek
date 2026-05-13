// src/app/api/admin/chemist-copilot/send/route.ts

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { note_id, final_text, send_via } = await request.json()
    // send_via: 'email' | 'whatsapp' | 'both'

    if (!note_id || !final_text || !send_via) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Get the note and customer
    const { data: note } = await adminClient
      .from('clinical_notes')
      .select('*, profiles!clinical_notes_user_id_fkey(email, full_name, phone)')
      .eq('id', note_id)
      .single()

    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    const profile = note.profiles as any
    if (!profile) return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })

    // 2. Send via email
    if (send_via === 'email' || send_via === 'both') {
      if (!process.env.RESEND_API_KEY) {
        console.warn('Skipping email send: RESEND_API_KEY not set')
      } else if (profile.email) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'hello@toneek.com',
          to: profile.email,
          subject: 'A clinical note from your Toneek chemist',
          html: `
            <div style="font-family:system-ui;max-width:560px;margin:0 auto;">
              <p>${final_text.replace(/\n/g, '<br>')}</p>
              <p style="color:#8C7B72;font-size:12px;margin-top:24px;">
                Toneek Clinical Team · toneek.com
              </p>
            </div>
          `,
        })
      }
    }

    // 3. Send via WhatsApp
    if (send_via === 'whatsapp' || send_via === 'both') {
      const apiUrl = process.env.WHATSAPP_API_URL
      const apiKey = process.env.WHATSAPP_API_TOKEN
      
      if (!apiUrl || !apiKey) {
         console.warn('Skipping WhatsApp send: API URL or Token not set')
      } else if (profile.phone) {
        // Example integration via webhook / generic API
        await fetch(`${apiUrl}?phone=${profile.phone}&apikey=${apiKey}&text=${encodeURIComponent(final_text)}`)
      }
    }

    // 4. Update the note to approved state with final text
    await adminClient.from('clinical_notes').update({
      note_text: final_text,
      note_type: 'ai_approved',
      sent_at: new Date().toISOString(),
      sent_via: send_via,
    }).eq('id', note_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending copilot note:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
