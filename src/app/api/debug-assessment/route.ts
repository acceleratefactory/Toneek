import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll() {},
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'You are completely logged out', session: null })
    }

    // Fetch profile
    const { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

    // Fetch assessments securely linked to this ID
    const { data: linkedAssessments } = await adminClient
        .from('skin_assessments')
        .select('id, user_id, email, formula_code, created_at')
        .eq('user_id', session.user.id)

    // Fetch orphaned assessments strictly matching the lowercase email
    const { data: emailAssessments } = await adminClient
        .from('skin_assessments')
        .select('id, user_id, email, formula_code, created_at')
        .ilike('email', session.user.email ?? '')

    return NextResponse.json({
        session: {
            active_user_id: session.user.id,
            active_email: session.user.email,
        },
        profile_found: !!profile,
        linked_assessments_count: linkedAssessments?.length ?? 0,
        linked_assessments: linkedAssessments,
        all_assessments_for_this_email: emailAssessments,
    })
}
