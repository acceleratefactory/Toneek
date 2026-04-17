'use client'
// src/components/dashboard/AuthRefresher.tsx
// Handles Supabase token auto-refresh on the client side.
// Replaces the middleware session refresh without Edge runtime issues.
// Returns null — invisible component. Add once to the dashboard layout.

import { createBrowserClient } from '@supabase/ssr'
import { useEffect } from 'react'

export default function AuthRefresher() {
    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // onAuthStateChange internally manages token refresh.
        // When the access token is about to expire, Supabase refreshes it
        // automatically and fires this event with the new session.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, _session) => {
                // Token refreshed — no action needed.
                // The refreshed token is stored in the cookie automatically.
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return null
}
