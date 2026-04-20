// src/app/api/auth/session/route.ts
// Sets Supabase session from access_token + refresh_token.
// Called client-side after browser-based PKCE or hash exchange.
//
// KEY FIX: cookies are written directly to the NextResponse object,
// NOT via cookieStore.set() which is read-only in Route Handlers.

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const { access_token, refresh_token } = await request.json()

        if (!access_token || !refresh_token) {
            return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
        }

        // Create the response FIRST — cookies are written directly to it
        const response = NextResponse.json({ success: true })

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    // Write directly to the response object (not cookieStore — read-only in Route Handlers)
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
        })

        if (error || !data.session) {
            console.error('setSession error:', error?.message)
            return NextResponse.json({ error: error?.message ?? 'Session failed' }, { status: 401 })
        }

        // ─── ASSESSMENT LINKER ───
        // Sweep for any orphaned assessments with this user's email and attach their new user_id.
        // This permanently glues pre-login assessments to the newly created account.
        if (data.session.user.email) {
            const { error: linkError } = await adminClient
                .from('skin_assessments')
                .update({ user_id: data.session.user.id })
                .ilike('email', data.session.user.email)
                .is('user_id', null)
                
            if (linkError) {
                console.error('Assessment Linker failed:', linkError)
            }
        }

        return response

    } catch (err: any) {
        console.error('Session endpoint error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
