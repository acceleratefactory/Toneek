// src/app/api/auth/session/route.ts
// Called by HashAuthHandler with the access_token + refresh_token from the URL hash.
// Uses createServerClient to call setSession() — which writes the auth cookie
// via the setAll callback so the server can read it on the next request.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { access_token, refresh_token } = await request.json()

        if (!access_token || !refresh_token) {
            return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
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

        // Set the session server-side — writesCookie via setAll callback above
        const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
        })

        if (error || !data.session) {
            console.error('setSession error:', error?.message)
            return NextResponse.json({ error: error?.message ?? 'Session failed' }, { status: 401 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Session endpoint error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
