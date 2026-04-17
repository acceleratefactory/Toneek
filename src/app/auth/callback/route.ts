// src/app/auth/callback/route.ts
// Handles the magic link / OTP callback from Supabase.
// Supabase redirects here after the user clicks the email link.
//
// Two flows handled:
// 1. token_hash + type  → email OTP verification (most common for magic links sent from server-side)
// 2. code               → PKCE exchange (when code_verifier cookie is present)

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)

    const token_hash = searchParams.get('token_hash')
    const type       = searchParams.get('type') as EmailOtpType | null
    const code       = searchParams.get('code')
    const next       = searchParams.get('next') ?? '/dashboard'
    const error      = searchParams.get('error')

    // Supabase returned an error (e.g. expired link)
    if (error) {
        console.error('Auth callback error:', error, searchParams.get('error_description'))
        return NextResponse.redirect(`${origin}/assessment?auth_error=expired`)
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                },
            },
        }
    )

    // ── Flow 1: token_hash (email OTP — most common for server-sent magic links) ──
    if (token_hash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type,
        })

        if (!verifyError) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error('OTP verify error:', verifyError.message)
        return NextResponse.redirect(`${origin}/assessment?auth_error=expired`)
    }

    // ── Flow 2: code exchange (PKCE — when code_verifier cookie exists) ──
    if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error('Code exchange error:', exchangeError.message)
        return NextResponse.redirect(`${origin}/assessment?auth_error=invalid`)
    }

    // No valid params — send back to assessment
    return NextResponse.redirect(`${origin}/assessment`)
}
