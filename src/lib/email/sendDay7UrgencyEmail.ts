// src/lib/email/sendDay7UrgencyEmail.ts
import { Resend } from 'resend'
import Day7UrgencyEmail from '@/emails/Day7UrgencyEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendDay7UrgencyEmailParams {
    email: string
    formula_code: string
    assessment_id?: string
}

export async function sendDay7UrgencyEmail(params: SendDay7UrgencyEmailParams) {
    try {
        const envFrom = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
        const fromEmail = envFrom.includes('<') ? envFrom : `Toneek <${envFrom}>`

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [params.email],
            subject: `Action required: Your clinical profile is awaiting dispatch`,
            react: Day7UrgencyEmail(params),
        })

        if (error) {
            console.error('Resend error (Day 7):', error)
            return { success: false, error }
        }

        return { success: true, id: data?.id }
    } catch (err) {
        console.error('sendDay7UrgencyEmail exception:', err)
        return { success: false, error: err }
    }
}
