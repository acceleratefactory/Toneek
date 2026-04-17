'use client'
// src/components/dashboard/WelcomeDismiss.tsx
// Dismiss button for the welcome banner.
// Hides the banner for this session only (no DB write needed).

import { useState } from 'react'

export default function WelcomeDismiss() {
    const [dismissed, setDismissed] = useState(false)

    if (dismissed) return null

    const handleDismiss = () => {
        setDismissed(true)
        // Hide the parent banner via DOM (server-rendered, can't use state directly)
        const banner = document.getElementById('welcome-banner')
        if (banner) banner.style.display = 'none'
    }

    return (
        <button
            onClick={handleDismiss}
            aria-label="Dismiss welcome message"
            style={{
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0.25rem',
                flexShrink: 0,
                lineHeight: 1,
            }}
        >
            ✕
        </button>
    )
}
