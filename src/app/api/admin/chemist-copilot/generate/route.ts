// src/app/api/admin/chemist-copilot/generate/route.ts

import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { generateClinicalNote } from '@/lib/intelligence/aiProvider'

export async function POST(request: NextRequest) {
  try {
    const { customer_id } = await request.json()
    if (!customer_id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    // 1. Gather the Clinical Journey Timeline for this customer
    const [
      { data: profile },
      { data: assessments },
      { data: orders },
      { data: outcomes },
      { data: concerns },
    ] = await Promise.all([
      adminClient.from('profiles')
        .select('full_name, email, formula_received_at')
        .eq('id', customer_id).single(),
      adminClient.from('skin_assessments')
        .select('formula_code, primary_concern, skin_type, climate_zone, formula_tier, skin_os_score, analysis_scores, risk_score, isotretinoin_flag, barrier_overload_flag, created_at')
        .eq('user_id', customer_id)
        .order('created_at', { ascending: false })
        .limit(3),
      adminClient.from('orders')
        .select('status, payment_status, received_at, routine_tier, fourth_product_name, created_at')
        .eq('user_id', customer_id)
        .order('created_at', { ascending: false })
        .limit(5),
      adminClient.from('skin_outcomes')
        .select('check_in_week, improvement_score, adverse_reactions, adherence_score, recorded_at')
        .eq('user_id', customer_id)
        .order('recorded_at', { ascending: true }),
      adminClient.from('concern_reports')
        .select('description, reaction_type, photo_url, reported_at, status')
        .eq('user_id', customer_id)
        .order('reported_at', { ascending: true }),
    ])

    // 2. Build the timeline context object
    const current_assessment = assessments?.[0]
    const received_at = profile?.formula_received_at
    const days_on_protocol = received_at
      ? Math.floor((Date.now() - new Date(received_at).getTime()) / 86400000)
      : null

    const timeline_context = {
      customer_name: profile?.full_name,
      formula_code: current_assessment?.formula_code,
      primary_concern: current_assessment?.primary_concern,
      skin_type: current_assessment?.skin_type,
      climate_zone: current_assessment?.climate_zone,
      formula_tier: current_assessment?.formula_tier,
      skin_os_score: current_assessment?.skin_os_score,
      days_on_protocol,
      outcomes: outcomes?.map((o: any) => ({
        week: o.check_in_week,
        score: o.improvement_score,
        adverse: o.adverse_reactions,
        adherence: o.adherence_score,
      })),
      concerns: concerns?.map((c: any) => ({
        description: c.description,
        type: c.reaction_type,
        day: received_at
          ? Math.floor((new Date(c.reported_at).getTime() - new Date(received_at).getTime()) / 86400000)
          : null,
      })),
      flags: {
        isotretinoin: current_assessment?.isotretinoin_flag,
        barrier_overload: current_assessment?.barrier_overload_flag,
        risk_score: current_assessment?.risk_score,
      },
    }

    // 3. Call the flexible AI Provider (Gemini/Claude/OpenAI)
    const draft = await generateClinicalNote(timeline_context)

    // 4. Save the draft input for audit trail
    // (Note: admin_id is not strictly validated here via user session to keep it simple for the admin client, 
    // but in a production environment you'd extract it from the authenticated user token)
    
    const { data: insertedNote, error: insertError } = await adminClient.from('clinical_notes').insert({
      user_id: customer_id,
      note_text: draft,
      note_type: 'ai_drafted',
      ai_draft_input: timeline_context,
    }).select().single()

    if (insertError) {
      console.error('Error inserting draft note:', insertError)
    }

    return NextResponse.json({ 
      draft, 
      note_id: insertedNote?.id,
      timeline_context 
    })
  } catch (error: any) {
    console.error('Error generating copilot draft:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
