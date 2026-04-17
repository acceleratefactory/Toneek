'use client'
// src/components/HashAuthHandler.tsx
// Handles Supabase magic links that deliver access_token in the URL hash.
// This happens with: Supabase admin-resent links, or implicit flow links
// that redirect to the site root instead of /auth/callback.
//
// When the hash contains #access_token=..., the Supabase browser client
// auto-processes it and fires onAuthStateChange with SIGNED_IN.
// We then redirect to /dashboard.

import { createBrowserClient } from '@supabase/ssr'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HashAuthHandler() {
    const router = useRouter()

    useEffect(() => {
        // Only run if there's a hash with an access_token
        if (!window.location.hash.includes('access_token')) return

        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Supabase browser client auto-processes the hash on init.
        // Listen for the SIGNED_IN event then redirect.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                    subscription.unsubscribe()
                    // Small delay to ensure cookies are written before navigation
                    setTimeout(() => {
                        router.push('/dashboard')
                    }, 100)
                }
            }
        )

        // Also try getSession immediately (handles case where event already fired)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                subscription.unsubscribe()
                router.push('/dashboard')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    return null
}
