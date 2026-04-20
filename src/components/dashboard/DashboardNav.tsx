'use client'
// src/components/dashboard/DashboardNav.tsx
// Navigation for the dashboard.
// variant="bottom" → mobile fixed bottom bar
// variant="sidebar" → desktop left sidebar (shown via CSS)

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
    { href: '/dashboard',              label: 'My Formula',  icon: '🧪', id: 'nav-formula'  },
    { href: '/dashboard/orders',       label: 'My Orders',   icon: '📦', id: 'nav-orders'   },
    { href: '/dashboard/checkin',      label: 'Check-in',    icon: '✅', id: 'nav-checkin'  },
    { href: '/dashboard/profile',      label: 'My Profile',  icon: '👤', id: 'nav-profile'  },
    { href: '/dashboard/subscription', label: 'Plan',        icon: '💳', id: 'nav-plan'     },
]

interface DashboardNavProps {
    variant: 'bottom' | 'sidebar'
}

export default function DashboardNav({ variant }: DashboardNavProps) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/assessment'
    }

    if (variant === 'bottom') {
        return (
            <nav
                aria-label="Dashboard navigation"
                style={{
                    position: 'fixed',
                    bottom: 0, left: 0, right: 0,
                    background: '#111',
                    borderTop: '1px solid #222',
                    display: 'flex',
                    zIndex: 100,
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {NAV_ITEMS.map(item => {
                    const active = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            id={item.id}
                            href={item.href}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.65rem 0.25rem',
                                textDecoration: 'none',
                                color: active ? '#d4a574' : '#555',
                                borderTop: active ? '2px solid #d4a574' : '2px solid transparent',
                                transition: 'color 0.15s',
                                fontSize: '0',
                            }}
                            aria-current={active ? 'page' : undefined}
                        >
                            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{item.icon}</span>
                            <span style={{
                                fontSize: '0.65rem',
                                marginTop: '0.2rem',
                                color: active ? '#d4a574' : '#555',
                                letterSpacing: '0.02em',
                            }}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
                <button
                    onClick={handleLogout}
                    title="Log Out"
                    style={{
                        flex: 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.65rem 0.25rem',
                        background: 'transparent',
                        border: 'none',
                        borderTop: '2px solid transparent',
                        color: '#e05555',
                        cursor: 'pointer',
                        fontSize: '0',
                    }}
                >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🚪</span>
                    <span style={{ fontSize: '0.65rem', marginTop: '0.2rem', letterSpacing: '0.02em' }}>
                        Log Out
                    </span>
                </button>
            </nav>
        )
    }

    // Sidebar variant (desktop)
    return (
        <nav
            aria-label="Dashboard navigation"
            style={{
                width: '220px',
                flexShrink: 0,
                padding: '2rem 1rem',
                borderRight: '1px solid #1a1a1a',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
            }}
        >
            <p style={{ color: '#444', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', paddingLeft: '0.75rem' }}>
                Dashboard
            </p>
            {NAV_ITEMS.map(item => {
                const active = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                    <Link
                        key={item.href}
                        id={`sidebar-${item.id}`}
                        href={item.href}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: active ? '#d4a574' : '#888',
                            background: active ? 'rgba(212,165,116,0.08)' : 'transparent',
                            fontSize: '0.88rem',
                            fontWeight: active ? 600 : 400,
                            transition: 'all 0.15s',
                        }}
                        aria-current={active ? 'page' : undefined}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </Link>
                )
            })}
            
            <div style={{ flex: 1 }} />
            
            <button
                onClick={handleLogout}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#e05555',
                    background: 'transparent',
                    border: '1px solid rgba(224,85,85,0.2)',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginTop: 'auto',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                }}
            >
                <span>🚪</span>
                Log Out
            </button>
        </nav>
    )
}
