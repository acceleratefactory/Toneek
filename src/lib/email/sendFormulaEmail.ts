// src/lib/email/sendFormulaEmail.ts
// Sends the formula assignment email via Resend.
// Called by /api/assessments/submit after the assessment is saved to DB.

import { Resend } from 'resend'
import FormulaEmail from '@/emails/FormulaEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendFormulaEmailParams {
    email: string
    formula_code: string
    formula: any
    skin_os_score: number
    primary_concern: string
    climate_zone: string
    routine_expectation: string
    isotretinoin_flag?: boolean
    assessment_id?: string
}

export async function sendFormulaEmail(params: SendFormulaEmailParams) {
    const {
        email,
        formula_code,
        formula,
        skin_os_score,
        primary_concern,
        climate_zone,
        routine_expectation,
        isotretinoin_flag,
        assessment_id,
    } = params

    try {
        const { data, error } = await resend.emails.send({
            from: 'Toneek <onboarding@resend.dev>',
            to: [email],
            subject: `Your Toneek formula: ${formula_code}`,
            react: FormulaEmail({
                email,
                formula_code,
                formula,
                skin_os_score,
                primary_concern,
                climate_zone,
                routine_expectation,
                isotretinoin_flag,
                assessment_id,
            }),
        })

        if (error) {
            console.error('Resend error:', error)
            return { success: false, error }
        }

        return { success: true, id: data?.id }
    } catch (err) {
        console.error('sendFormulaEmail exception:', err)
        return { success: false, error: err }
    }
}
