// src/lib/scores/recalculateSkinOSScore.ts
// Recalculates the customer's Skin OS Score at Week 8 based on their improvement score.
// Called by: /api/checkin/submit and /api/webhooks/whatsapp-reply.
//
// Delta table (improvement_score is on 2–10 scale):
//   9–10 → +20  (dramatic improvement)
//   7–8  → +12  (significant improvement)
//   5–6  → +5   (noticeable improvement)
//   3–4  → +0   (slight improvement — holds current score)
//   1–2  → -5   (no change — flags for reformulation review)
//
// New score is capped between 15 and 100.

import { adminClient } from '@/lib/supabase/admin'

export async function recalculateSkinOSScore(
    user_id: string,
    week8_improvement_score: number // 2–10 scale
): Promise<number> {

    // Get the original (first) assessment score as the baseline
    const { data: firstAssessment } = await adminClient
        .from('skin_assessments')
        .select('skin_os_score')
        .eq('user_id', user_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

    const baseline_score = firstAssessment?.skin_os_score ?? 50

    // Calculate delta
    let delta = 0
    if (week8_improvement_score >= 9)      delta = 20
    else if (week8_improvement_score >= 7) delta = 12
    else if (week8_improvement_score >= 5) delta = 5
    else if (week8_improvement_score >= 3) delta = 0
    else                                   delta = -5  // flag for reformulation

    const new_score = Math.min(100, Math.max(15, baseline_score + delta))

    // Fetch most recent assessment ID (to update its score)
    const { data: latestAssessment } = await adminClient
        .from('skin_assessments')
        .select('id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (latestAssessment) {
        // Update the score on the latest assessment
        await adminClient
            .from('skin_assessments')
            .update({ skin_os_score: new_score })
            .eq('id', latestAssessment.id)

        // If score indicates poor response → flag for reformulation review
        if (week8_improvement_score < 4) {
            await adminClient
                .from('skin_assessments')
                .update({
                    is_flagged_for_review: true,
                    flag_reason: `Week 8 improvement score: ${week8_improvement_score}/10 — reformulation candidate`,
                })
                .eq('id', latestAssessment.id)

            // Notify admin via WhatsApp
            await notifyAdminReformulationCandidate(user_id, week8_improvement_score, latestAssessment.id)
        }
    }

    console.log(`[Score] User ${user_id} — baseline: ${baseline_score}, delta: ${delta > 0 ? '+' : ''}${delta}, new: ${new_score}`)

    return new_score
}

// ─── Admin notification for poor Week 8 response ─────────────────────────────

async function notifyAdminReformulationCandidate(
    user_id: string,
    score: number,
    assessment_id: string
) {
    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER
    const apiUrl     = process.env.WHATSAPP_API_URL
    const apiKey     = process.env.WHATSAPP_API_TOKEN
    const base       = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://toneek.vercel.app'

    const message =
        `⚠️ Reformulation candidate\n` +
        `User: ${user_id}\n` +
        `Week 8 score: ${score}/10\n` +
        `Assessment flagged for review.\n` +
        `${base}/admin`

    if (adminPhone && apiUrl) {
        try {
            await fetch(`${apiUrl}?phone=${encodeURIComponent(adminPhone)}&apikey=${apiKey}&text=${encodeURIComponent(message)}`)
        } catch (err) {
            console.error('[Reformulation WhatsApp failed]', err)
        }
    } else {
        console.log('[Reformulation candidate]', message)
    }

    // Also email admin
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
        try {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY)
            const from   = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'

            await resend.emails.send({
                from,
                to: adminEmail,
                subject: `⚠️ Reformulation candidate — Week 8 score ${score}/10`,
                html: `
                    <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                        <h2 style="color:#b45309;margin:0 0 16px;">Reformulation Candidate</h2>
                        <p style="color:#374151;">A customer's Week 8 check-in scored <strong>${score}/10</strong> — this is below the threshold for continued formula use without review.</p>
                        <table style="width:100%;margin:16px 0 24px;border-collapse:collapse;">
                            <tr>
                                <td style="padding:8px 0;color:#666;">User ID</td>
                                <td style="padding:8px 0;font-family:monospace;">${user_id}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#666;">Assessment</td>
                                <td style="padding:8px 0;font-family:monospace;">${assessment_id}</td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0;color:#666;">Week 8 score</td>
                                <td style="padding:8px 0;font-weight:600;color:#b45309;">${score}/10</td>
                            </tr>
                        </table>
                        <p style="color:#374151;margin-bottom:24px;">The assessment has been flagged for review in your admin panel.</p>
                        <a href="${base}/admin"
                           style="display:inline-block;background:#0f0f0f;color:#fff;
                                  padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                            Review in admin →
                        </a>
                    </div>
                `,
            })
        } catch (err) {
            console.error('[Reformulation email failed]', err)
        }
    }
}
