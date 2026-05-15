// src/lib/email/sendDay1ScienceEmail.ts
import { Resend } from 'resend'
import Day1ScienceEmail from '@/emails/Day1ScienceEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendDay1ScienceEmailParams {
    email: string
    formula_code: string
    primary_concern: string
    analysis_scores?: any
    assessment_id?: string
}

export async function sendDay1ScienceEmail(params: SendDay1ScienceEmailParams) {
    try {
        const envFrom = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
        const fromEmail = envFrom.includes('<') ? envFrom : `Toneek <${envFrom}>`

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [params.email],
            subject: `The science behind your Toneek formula`,
            react: Day1ScienceEmail(params),
        })

        if (error) {
            console.error('Resend error (Day 1):', error)
            return { success: false, error }
        }

        return { success: true, id: data?.id }
    } catch (err) {
        console.error('sendDay1ScienceEmail exception:', err)
        return { success: false, error: err }
    }
}
