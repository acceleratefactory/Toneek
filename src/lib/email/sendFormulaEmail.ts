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
    magic_link?: string
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
        magic_link,
    } = params

    try {
        const envFrom = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
        const fromEmail = envFrom.includes('<') ? envFrom : `Toneek <${envFrom}>`

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [email],
            subject: `Welcome to Toneek. Your custom formula is ready.`,
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
                magic_link,
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
