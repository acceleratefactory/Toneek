'use client'
// src/components/HashAuthHandler.tsx
// Handles Supabase magic links that deliver access_token in the URL hash.
// Extracts tokens from hash, POSTs to /api/auth/session to set server-side cookie,
// then redirects to /dashboard.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HashAuthHandler() {
    const router = useRouter()

    useEffect(() => {
        // Failsafe: if Supabase stripped the /auth/confirm path and dumped ?code= on the Home page,
        // intercept it and forward it to the correct handler page.
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')
        if (code && window.location.pathname === '/') {
            window.location.href = `/auth/confirm?code=${code}&next=/dashboard`
            return
        }

        const hash = window.location.hash
        if (!hash.includes('access_token')) return

        // Parse hash fragment (?access_token=...&refresh_token=...)
        const params = new URLSearchParams(hash.replace('#', ''))
        const access_token  = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (!access_token || !refresh_token) return

        // Clear the hash from the URL immediately (security)
        window.history.replaceState(null, '', window.location.pathname)

        // POST tokens to server to set a proper server-side session cookie
        fetch('/api/auth/session', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ access_token, refresh_token }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Hard navigate (full reload) so Next.js server reads fresh cookies
                    window.location.href = '/dashboard'
                } else {
                    console.error('Session setup failed:', data.error)
                }
            })
            .catch(err => {
                console.error('HashAuthHandler fetch error:', err)
            })
    }, [router])

    return null
}
