// src/app/(dashboard)/dashboard/profile/page.tsx
// My Profile view — editable fields + read-only assessment data.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/dashboard/ProfileForm'

export const metadata = { title: 'My Profile — Toneek' }

export default async function ProfilePage() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/assessment')

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, city, country, subscription_status, subscription_tier')
        .eq('id', session.user.id)
        .single()

    // Fetch latest assessment (read-only display data)
    const { data: assessment } = await supabase
        .from('skin_assessments')
        .select('primary_concern, skin_type, formula_code, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    // Reassessment eligibility — 6 weeks from last assessment
    const lastAssessedAt   = assessment ? new Date(assessment.created_at) : null
    const eligibleAt       = lastAssessedAt
        ? new Date(lastAssessedAt.getTime() + 42 * 24 * 60 * 60 * 1000)
        : null
    const reassessEligible = eligibleAt ? new Date() >= eligibleAt : true
    const eligibleDateStr  = eligibleAt
        ? eligibleAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : null

    const READ_ONLY = [
        { label: 'Primary concern',    value: assessment?.primary_concern   ?? '—' },
        { label: 'Skin type',          value: assessment?.skin_type         ?? '—' },
        { label: 'Formula',            value: assessment?.formula_code      ?? '—' },
        { label: 'Subscription plan',  value: profile?.subscription_tier   ?? '—' },
        { label: 'Account email',      value: profile?.email ?? session.user.email ?? '—' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f5f5f5' }}>My Profile</h1>

            {/* Editable form */}
            <ProfileForm
                profileId={session.user.id}
                initialFullName={profile?.full_name ?? ''}
                initialPhone={profile?.phone ?? ''}
                initialCity={profile?.city ?? ''}
                initialCountry={profile?.country ?? ''}
            />

            {/* Read-only section */}
            <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                    Skin profile (read-only)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {READ_ONLY.map(({ label, value }) => (
                        <div key={label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.65rem 0',
                            borderBottom: '1px solid #1f1f1f',
                        }}>
                            <span style={{ color: '#666', fontSize: '0.85rem' }}>{label}</span>
                            <span style={{ color: '#f5f5f5', fontSize: '0.85rem', fontWeight: 500, textTransform: 'capitalize' }}>
                                {value.replace(/_/g, ' ')}
                            </span>
                        </div>
                    ))}
                </div>
                <p style={{ color: '#444', fontSize: '0.75rem', marginTop: '0.75rem', lineHeight: '1.4' }}>
                    These values are set by your assessment and updated when you reassess.
                </p>
            </section>

            {/* Reassessment eligibility */}
            <section style={{
                background: reassessEligible ? 'rgba(212,165,116,0.06)' : '#1a1a1a',
                border: `1px solid ${reassessEligible ? 'rgba(212,165,116,0.25)' : '#222'}`,
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
            }}>
                <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    Update your assessment
                </p>
                {reassessEligible ? (
                    <>
                        <p style={{ color: '#ccc', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                            Your skin profile can now be updated. If your condition, routine, or circumstances have changed, a new assessment will trigger a formula review.
                        </p>
                        <a
                            href="/assessment"
                            id="reassess-link"
                            style={{
                                display: 'inline-block', padding: '0.65rem 1.25rem',
                                background: '#d4a574', color: '#0f0f0f',
                                borderRadius: '8px', textDecoration: 'none',
                                fontWeight: 700, fontSize: '0.85rem',
                            }}
                        >
                            Start reassessment →
                        </a>
                    </>
                ) : (
                    <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: '1.5' }}>
                        You can update your skin assessment from{' '}
                        <strong style={{ color: '#888' }}>{eligibleDateStr}</strong> — 6 weeks after your last assessment.
                    </p>
                )}
            </section>

        </div>
    )
}
