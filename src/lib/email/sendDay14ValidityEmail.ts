// src/lib/email/sendDay14ValidityEmail.ts
import { Resend } from 'resend'
import Day14ValidityEmail from '@/emails/Day14ValidityEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendDay14ValidityEmailParams {
    email: string
    formula_code: string
    assessment_id?: string
}

export async function sendDay14ValidityEmail(params: SendDay14ValidityEmailParams) {
    try {
        const envFrom = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
        const fromEmail = envFrom.includes('<') ? envFrom : `Toneek <${envFrom}>`

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [params.email],
            subject: `Your clinical formula is still assigned`,
            react: Day14ValidityEmail(params),
        })

        if (error) {
            console.error('Resend error (Day 14):', error)
            return { success: false, error }
        }

        return { success: true, id: data?.id }
    } catch (err) {
        console.error('sendDay14ValidityEmail exception:', err)
        return { success: false, error: err }
    }
}
