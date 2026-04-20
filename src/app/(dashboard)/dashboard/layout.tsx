// src/app/(dashboard)/dashboard/layout.tsx
// Gated layout for all dashboard pages.
// Checks auth session + subscription status on every render.
// Mobile: bottom navigation bar. Desktop: left sidebar.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'
import WelcomeDismiss from '@/components/dashboard/WelcomeDismiss'
import AuthRefresher from '@/components/dashboard/AuthRefresher'

export const metadata = {
    title: 'Dashboard — Toneek',
    description: 'Your Toneek skin intelligence dashboard.',
}

async function getSessionAndProfile() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { session: null, profile: null }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, subscription_status, subscription_tier')
        .eq('id', session.user.id)
        .single()

    // Fetch latest assessment_id for the subscribe redirect
    const { data: latestAssessment } = await supabase
        .from('skin_assessments')
        .select('id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    return { session, profile, assessmentId: latestAssessment?.id ?? null }
}

// ─── Welcome banner ───────────────────────────────────────────────────────────

function WelcomeBanner({ name }: { name?: string | null }) {
    return (
        <div
            id="welcome-banner"
            style={{
                background: 'rgba(212,165,116,0.08)',
                border: '1px solid rgba(212,165,116,0.25)',
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
            }}
        >
            <p style={{ color: '#d4a574', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                🧪 <strong>{name ? `${name.split(' ')[0]}, your` : 'Your'} formula is in production.</strong>{' '}
                You'll receive a WhatsApp update when it's dispatched.
            </p>
            <WelcomeDismiss />
        </div>
    )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function DashboardLayout({
    children,
    searchParams,
}: {
    children: React.ReactNode
    searchParams?: Promise<{ welcome?: string }>
}) {
    const { session, profile, assessmentId } = await getSessionAndProfile()

    // Not authenticated — send to assessment
    if (!session) {
        redirect('/assessment')
    }

    // Subscription checks are removed as per request to allow access to dashboard regardless.
    // If you ever want to re-add it, the logic is stored in git history.

    const params      = searchParams ? await searchParams : {}
    const showWelcome = params?.welcome === 'true'
    const isCancelled = profile.subscription_status === 'cancelled'

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0f0f0f',
            color: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Client-side token auto-refresh — replaces middleware */}
            <AuthRefresher />
            {/* Welcome banner — only on ?welcome=true */}
            {showWelcome && (
                <WelcomeBanner name={profile.full_name} />
            )}

            {/* Cancelled subscription notice */}
            {isCancelled && (
                <div style={{
                    background: 'rgba(224,85,85,0.08)',
                    border: '1px solid rgba(224,85,85,0.25)',
                    padding: '0.85rem 1.5rem',
                    textAlign: 'center',
                }}>
                    <p style={{ color: '#e05555', fontSize: '0.88rem', margin: 0 }}>
                        Your subscription has been cancelled.{' '}
                        <a href="/subscribe" style={{ color: '#d4a574', textDecoration: 'underline' }}>
                            Reactivate to continue your formula
                        </a>
                    </p>
                </div>
            )}

            <div style={{ display: 'flex', flex: 1 }}>
                {/* Desktop sidebar */}
                <aside className="dashboard-sidebar">
                    <DashboardNav variant="sidebar" />
                </aside>

                {/* Main content */}
                <main style={{ flex: 1, padding: '1.5rem', maxWidth: '760px', margin: '0 auto', width: '100%' }}>
                    {children}
                </main>
            </div>

            {/* Mobile bottom nav */}
            <DashboardNav variant="bottom" />

            {/* Bottom nav spacer on mobile */}
            <div className="dashboard-bottom-spacer" style={{ height: '72px' }} aria-hidden="true" />
        </div>
    )
}
