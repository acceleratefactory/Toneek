// src/app/api/subscriptions/[id]/pause/route.ts
// PATCH — pauses the subscription for 30 days.
// Only the authenticated subscription owner can pause.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
                },
            }
        )

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        const pauseUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const { error } = await supabase
            .from('subscriptions')
            .update({ status: 'paused', pause_until: pauseUntil })
            .eq('id', id)
            .eq('user_id', session.user.id) // RLS enforced at query level too

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ success: true, pause_until: pauseUntil })

    } catch (err: any) {
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
    }
}
