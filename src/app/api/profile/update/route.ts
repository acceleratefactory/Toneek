// src/app/api/profile/update/route.ts
// PATCH — updates editable profile fields for the authenticated user.
// Only updates fields the customer is allowed to change.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
    try {
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
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await request.json()
        const { full_name, phone, city, country, avatar_url } = body

        // Use adminClient to bypass the recursive infinite loop RLS bug on the profiles table
        const { error } = await adminClient
            .from('profiles')
            .update({
                ...(full_name  !== undefined && { full_name:  full_name.trim() }),
                ...(phone      !== undefined && { phone:      phone.trim()     }),
                ...(city       !== undefined && { city:       city.trim()      }),
                ...(country    !== undefined && { country:    country.trim()   }),
                ...(avatar_url !== undefined && { avatar_url: avatar_url       }),
            })
            .eq('id', session.user.id)

        if (error) {
            console.error('Profile update error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Profile update unexpected error:', err)
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
    }
}
