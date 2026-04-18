'use client'
// src/app/auth/confirm/page.tsx
// Unified client-side auth exchange page.
// Handles all Supabase magic link flows:
//   1. ?code=...       → PKCE exchange (browser client reads code_verifier from localStorage)
//   2. ?token_hash=... → OTP verification (no PKCE needed)
//   3. #access_token=  → Implicit hash flow (from admin panel magic links)
// After exchange, POSTs tokens to /api/auth/session to set server-side cookies,
// then does a full-page reload to /dashboard.

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import type { EmailOtpType } from '@supabase/supabase-js'

function AuthConfirmInner() {
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'error'>('loading')
    const [message, setMessage] = useState('Verifying your link…')

    useEffect(() => {
        const code       = searchParams.get('code')
        const token_hash = searchParams.get('token_hash')
        const type       = searchParams.get('type') as EmailOtpType | null
        const next       = searchParams.get('next') ?? '/dashboard'
        const hash       = window.location.hash

        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        async function setServerSession(access_token: string, refresh_token: string, dest: string) {
            const res = await fetch('/api/auth/session', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ access_token, refresh_token }),
            })
            if (res.ok) {
                window.location.href = dest
            } else {
                setStatus('error')
                setMessage('Could not establish session. Please try again.')
            }
        }

        async function handleAuth() {
            // ── Flow 1: PKCE code exchange ────────────────────────────────────
            if (code) {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code)
                if (error || !data.session) {
                    setStatus('error')
                    setMessage('Link has expired or already been used. Please request a new one.')
                    return
                }
                await setServerSession(data.session.access_token, data.session.refresh_token, next)
                return
            }

            // ── Flow 2: token_hash OTP verification ───────────────────────────
            if (token_hash && type) {
                const { error } = await supabase.auth.verifyOtp({ token_hash, type })
                if (error) {
                    setStatus('error')
                    setMessage('Link has expired or already been used. Please request a new one.')
                    return
                }
                const { data } = await supabase.auth.getSession()
                if (data.session) {
                    await setServerSession(data.session.access_token, data.session.refresh_token, next)
                }
                return
            }

            // ── Flow 3: hash-based implicit flow ─────────────────────────────
            if (hash.includes('access_token')) {
                const params        = new URLSearchParams(hash.replace('#', ''))
                const access_token  = params.get('access_token')
                const refresh_token = params.get('refresh_token')
                if (access_token && refresh_token) {
                    await setServerSession(access_token, refresh_token, next)
                    return
                }
            }

            // No recognised params
            setStatus('error')
            setMessage('Invalid link. Redirecting to assessment…')
            setTimeout(() => { window.location.href = '/assessment' }, 2000)
        }

        handleAuth()
    }, [searchParams])

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f0f0f',
            color: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui',
        }}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#d4a574', fontWeight: 700, fontSize: '1.2rem', marginBottom: '1rem' }}>
                    Toneek
                </p>
                {status === 'loading' && (
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: '2px solid #333', borderTopColor: '#d4a574',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
                    }} />
                )}
                <p style={{ color: '#888', fontSize: '0.9rem' }}>{message}</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

export default function AuthConfirmPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#d4a574' }}>Loading…</p>
            </div>
        }>
            <AuthConfirmInner />
        </Suspense>
    )
}
