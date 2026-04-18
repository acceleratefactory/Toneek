'use client'
// src/app/auth/debug/page.tsx
// Debug page — shows exactly what Supabase sends to the callback URL.
// Use this as emailRedirectTo to diagnose auth issues.
// REMOVE this page before production launch.

import { useEffect, useState } from 'react'

export default function AuthDebugPage() {
    const [info, setInfo] = useState<Record<string, string>>({})

    useEffect(() => {
        const url = new URL(window.location.href)
        const hash = window.location.hash

        const data: Record<string, string> = {
            'Full URL': window.location.href,
            'Origin': window.location.origin,
            'Pathname': url.pathname,
            'Search (query params)': url.search || '(none)',
            'Hash fragment': hash || '(none)',
        }

        // Parse query params
        url.searchParams.forEach((value, key) => {
            data[`Query: ${key}`] = value
        })

        // Parse hash params
        if (hash) {
            const hashParams = new URLSearchParams(hash.replace('#', ''))
            hashParams.forEach((value, key) => {
                data[`Hash: ${key}`] = key === 'access_token' || key === 'refresh_token'
                    ? value.slice(0, 20) + '...'
                    : value
            })
        }

        // Show cookies (names only for security)
        data['Cookie names'] = document.cookie
            .split(';')
            .map(c => c.trim().split('=')[0])
            .join(', ') || '(none)'

        setInfo(data)
    }, [])

    return (
        <div style={{
            fontFamily: 'monospace',
            background: '#0f0f0f',
            color: '#f5f5f5',
            minHeight: '100vh',
            padding: '2rem',
        }}>
            <h1 style={{ color: '#d4a574', marginBottom: '1.5rem' }}>Auth Debug</h1>
            <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.85rem' }}>
                Copy this information and share it to diagnose the magic link flow.
            </p>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                    {Object.entries(info).map(([key, value]) => (
                        <tr key={key} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{
                                padding: '0.6rem 1rem 0.6rem 0',
                                color: '#888',
                                whiteSpace: 'nowrap',
                                verticalAlign: 'top',
                                fontSize: '0.8rem',
                            }}>{key}</td>
                            <td style={{
                                padding: '0.6rem 0',
                                color: '#f5f5f5',
                                wordBreak: 'break-all',
                                fontSize: '0.8rem',
                            }}>{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
