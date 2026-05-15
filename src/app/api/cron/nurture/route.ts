// src/app/api/cron/nurture/route.ts
import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { sendDay1ScienceEmail } from '@/lib/email/sendDay1ScienceEmail'
import { sendDay3FutureEmail } from '@/lib/email/sendDay3FutureEmail'
import { sendDay7UrgencyEmail } from '@/lib/email/sendDay7UrgencyEmail'
import { sendDay14ValidityEmail } from '@/lib/email/sendDay14ValidityEmail'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendWhatsAppMessage'

export async function GET(request: Request) {
    // 1. Basic security: protect the cron endpoint
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // We only want to look at assessments from the last 15 days to save query time.
        // And we only care about those where at least one nurture flag is false.
        const fifteenDaysAgo = new Date()
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

        const { data: assessments, error: dbError } = await adminClient
            .from('skin_assessments')
            .select(`
                id,
                created_at,
                formula_code,
                primary_concern,
                analysis_scores,
                nurture_day1_sent,
                nurture_day3_sent,
                nurture_day7_sent,
                nurture_day14_sent,
                user_id,
                profiles!inner (
                    email,
                    phone,
                    whatsapp,
                    subscription_status
                )
            `)
            .gte('created_at', fifteenDaysAgo.toISOString())

        if (dbError) {
            console.error('Failed to fetch assessments for cron:', dbError)
            return NextResponse.json({ error: 'DB Fetch Failed' }, { status: 500 })
        }

        const now = new Date()
        let processedCount = 0

        for (const record of assessments) {
            const profile = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles
            
            // HARD STOP: Never send nurture emails to active subscribers
            if (profile.subscription_status === 'active') {
                continue
            }

            if (!profile.email) continue

            const createdAt = new Date(record.created_at)
            const diffTime = Math.abs(now.getTime() - createdAt.getTime())
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

            const contactPhone = profile.whatsapp || profile.phone

            // ─── DAY 1: The Science ───────────────────────────────────────────
            if (diffDays === 1 && !record.nurture_day1_sent) {
                await sendDay1ScienceEmail({
                    email: profile.email,
                    formula_code: record.formula_code,
                    primary_concern: record.primary_concern,
                    analysis_scores: record.analysis_scores,
                    assessment_id: record.id
                })
                
                await adminClient.from('skin_assessments').update({ nurture_day1_sent: true }).eq('id', record.id)
                processedCount++
            }

            // ─── DAY 3: Future Pacing ─────────────────────────────────────────
            else if (diffDays === 3 && !record.nurture_day3_sent) {
                // Email
                await sendDay3FutureEmail({
                    email: profile.email,
                    formula_code: record.formula_code,
                    assessment_id: record.id
                })

                // WhatsApp Companion
                if (contactPhone) {
                    const persistentLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://toneek.vercel.app'}/login?email=${encodeURIComponent(profile.email)}`
                    const waMessage = `Hi from Toneek. It takes time to see clinical results. If you had started your protocol 3 days ago, your skin barrier would already be stabilizing. Begin your protocol today: ${persistentLink}`
                    await sendWhatsAppMessage({ phone: contactPhone, message: waMessage })
                }

                await adminClient.from('skin_assessments').update({ nurture_day3_sent: true }).eq('id', record.id)
                processedCount++
            }

            // ─── DAY 7: Final Urgency ─────────────────────────────────────────
            else if (diffDays === 7 && !record.nurture_day7_sent) {
                // Email
                await sendDay7UrgencyEmail({
                    email: profile.email,
                    formula_code: record.formula_code,
                    assessment_id: record.id
                })

                // WhatsApp Companion
                if (contactPhone) {
                    const persistentLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://toneek.vercel.app'}/login?email=${encodeURIComponent(profile.email)}`
                    const waMessage = `Hi from Toneek. Your custom formula ${record.formula_code} expires in 7 days. We are ready to compound your formula the moment your payment is confirmed. Finalise your protocol: ${persistentLink}`
                    await sendWhatsAppMessage({ phone: contactPhone, message: waMessage })
                }

                await adminClient.from('skin_assessments').update({ nurture_day7_sent: true }).eq('id', record.id)
                processedCount++
            }

            // ─── DAY 14: Soft Check-in ────────────────────────────────────────
            else if (diffDays === 14 && !record.nurture_day14_sent) {
                await sendDay14ValidityEmail({
                    email: profile.email,
                    formula_code: record.formula_code,
                    assessment_id: record.id
                })

                await adminClient.from('skin_assessments').update({ nurture_day14_sent: true }).eq('id', record.id)
                processedCount++
            }
        }

        return NextResponse.json({ success: true, processed: processedCount })
    } catch (err: any) {
        console.error('Nurture cron exception:', err)
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
    }
}
