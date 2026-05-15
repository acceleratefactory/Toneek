// src/lib/email/sendDay3FutureEmail.ts
import { Resend } from 'resend'
import Day3FutureEmail from '@/emails/Day3FutureEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendDay3FutureEmailParams {
    email: string
    formula_code: string
    assessment_id?: string
}

export async function sendDay3FutureEmail(params: SendDay3FutureEmailParams) {
    try {
        const envFrom = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
        const fromEmail = envFrom.includes('<') ? envFrom : `Toneek <${envFrom}>`

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [params.email],
            subject: `What happens in Week 1 of your Toneek protocol?`,
            react: Day3FutureEmail(params),
        })

        if (error) {
            console.error('Resend error (Day 3):', error)
            return { success: false, error }
        }

        return { success: true, id: data?.id }
    } catch (err) {
        console.error('sendDay3FutureEmail exception:', err)
        return { success: false, error: err }
    }
}
