import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()
        const BASE_URL = request.nextUrl.origin

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 })
        }

        // Generate magic link via Supabase Admin (bypasses rate limits and returns raw token)
        const confirmUrl = `${BASE_URL}/auth/confirm?next=/dashboard`
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: { redirectTo: confirmUrl },
        })

        if (linkError) {
            console.error('Magic link generation failed:', linkError.message)
            return NextResponse.json({ success: false, error: 'Could not generate link. Please try again.' }, { status: 500 })
        }

        if (linkData?.properties?.action_link) {
            let robustLink = linkData.properties.action_link
            try {
                // Ensure the domain perfectly matches the current BASE_URL (fixing Task A issues)
                const urlObj = new URL(robustLink)
                const token_hash = urlObj.searchParams.get('token_hash')
                const type = urlObj.searchParams.get('type') || 'magiclink'
                
                if (token_hash) {
                    robustLink = `${BASE_URL}/auth/confirm?token_hash=${token_hash}&type=${type}&next=/dashboard`
                } else if (urlObj.hash && urlObj.hash.includes('access_token')) {
                    robustLink = `${BASE_URL}/auth/confirm${urlObj.hash}`
                }
            } catch (e) {
                console.error('Failed to parse action_link:', e)
            }

            await sendMagicLinkEmail(email, robustLink)
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Login magic link error:', err)
        return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 })
    }
}

// ─── Magic link email ─────────────────────────────────────────────────────────

async function sendMagicLinkEmail(email: string, action_link: string) {
    const envFrom = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
    const from = envFrom.includes('<') ? envFrom : `Toneek <${envFrom}>`
    
    try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
            from,
            to: email,
            subject: 'Your Toneek dashboard access link',
            html: `
                <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px 0;">
                    <h2 style="margin:0 0 8px;color:#1a1a1a;">Access your Toneek dashboard</h2>
                    <p style="color:#374151;margin-bottom:24px;">
                        Click the link below to access your personalised formula and dashboard.
                        This link expires in 24 hours and can only be used once.
                    </p>
                    <a href="${action_link}"
                       style="display:inline-block;background:#1a1a1a;color:#d4a574;
                              padding:14px 28px;border-radius:8px;text-decoration:none;
                              font-weight:700;font-size:15px;letter-spacing:0.02em;">
                        Open my dashboard &rarr;
                    </a>
                    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
                        If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
            `,
        })
    } catch (err) {
        console.error('Magic link email failed:', err)
        throw new Error('Failed to send email via Resend.')
    }
}
