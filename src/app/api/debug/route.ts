import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    // Test 1: Admin client (bypasses RLS — pure connection test)
    const { data: adminData, error: adminError, count: adminCount } = await adminClient
        .from('formula_codes')
        .select('formula_code', { count: 'exact' })
        .limit(3)

    // Test 2: Anon client (tests RLS policy)
    const supabase = await createClient()
    const { count: anonCount, error: anonError } = await supabase
        .from('formula_codes')
        .select('*', { count: 'exact', head: true })

    return Response.json({
        admin: {
            count: adminCount,
            sample: adminData?.map(r => r.formula_code),
            error: adminError?.message ?? null,
        },
        anon: {
            count: anonCount,
            error: anonError?.message ?? null,
        },
        env: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
            anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            serviceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
    })
}
