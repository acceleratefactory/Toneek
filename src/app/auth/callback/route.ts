// src/app/auth/callback/route.ts
// Handles the Supabase magic link / OTP callback.
//
// KEY FIX: Create the redirect response FIRST, then pass it to createServerClient
// so Supabase writes the session cookies directly to the redirect response.
// Without this, cookies set via cookieStore.set() do NOT transfer to NextResponse.redirect().

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)

    const token_hash = searchParams.get('token_hash')
    const type       = searchParams.get('type') as EmailOtpType | null
    const code       = searchParams.get('code')
    const next       = searchParams.get('next') ?? '/dashboard'
    const error      = searchParams.get('error')

    // ── VERBOSE DEBUG LOG (remove after auth is stable) ──────────────────────
    console.log('[auth/callback] received', {
        url: request.url,
        token_hash: token_hash ? token_hash.slice(0, 20) + '...' : null,
        type,
        code: code ? code.slice(0, 20) + '...' : null,
        next,
        error,
        allParams: Object.fromEntries(searchParams.entries()),
        cookieNames: request.cookies.getAll().map(c => c.name),
    })
    // ─────────────────────────────────────────────────────────────────────────

    // Supabase returned an explicit error (e.g. expired link)
    if (error) {
        console.error('Auth callback error:', error, searchParams.get('error_description'))
        return NextResponse.redirect(`${origin}/assessment?auth_error=expired`)
    }


    // Create the redirect response FIRST — Supabase writes cookies directly to it
    const redirectResponse   = NextResponse.redirect(`${origin}${next}`)
    const errorResponseExpired = NextResponse.redirect(`${origin}/assessment?auth_error=expired`)
    const errorResponseInvalid = NextResponse.redirect(`${origin}/assessment?auth_error=invalid`)

    const makeClient = (targetResponse: NextResponse) => createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Read from the incoming request cookies (includes code_verifier)
                getAll() {
                    return request.cookies.getAll()
                },
                // Write directly to the target response so they travel with the redirect
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        targetResponse.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // ── Flow 1: token_hash (email OTP — no PKCE needed) ──────────────────────
    if (token_hash && type) {
        const supabase = makeClient(redirectResponse)
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash, type })

        if (!verifyError) return redirectResponse

        console.error('OTP verify error:', verifyError.message)
        return errorResponseExpired
    }

    // ── Flow 2: code exchange (PKCE — code_verifier must be in request cookies) ─
    if (code) {
        const supabase = makeClient(redirectResponse)
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError) return redirectResponse

        console.error('Code exchange error:', exchangeError.message)
        return errorResponseInvalid
    }

    // No valid params
    return NextResponse.redirect(`${origin}/assessment`)
}
