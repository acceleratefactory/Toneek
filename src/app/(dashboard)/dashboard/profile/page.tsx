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
        .select('id, full_name, email, phone, city, country, subscription_status, subscription_tier, avatar_url')
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
        <div className="flex flex-col gap-6 font-sans">
            {/* ── Top Header Banner (Zoho Style) ── */}
            <div className="bg-white dark:bg-[#261B18] pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 dark:border-[#3A2820] -mt-8 sm:-mt-8 mx-[-1rem] sm:mx-[-2rem] mb-2 relative pb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
            </div>

            {/* Editable form */}
            <ProfileForm
                profileId={session.user.id}
                initialFullName={profile?.full_name ?? ''}
                initialPhone={profile?.phone ?? ''}
                initialCity={profile?.city ?? ''}
                initialCountry={profile?.country ?? ''}
                initialAvatarUrl={profile?.avatar_url ?? ''}
            />

            {/* Read-only section */}
            <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-4 font-bold">
                    Skin profile (read-only)
                </p>
                <div className="flex flex-col gap-0 border-t border-gray-100 dark:border-gray-800">
                    {READ_ONLY.map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#1f1f1f]">
                            <span className="text-gray-500 dark:text-[#666] text-sm">{label}</span>
                            <span className="text-gray-900 dark:text-[#f5f5f5] text-sm font-medium capitalize">
                                {value.replace(/_/g, ' ')}
                            </span>
                        </div>
                    ))}
                </div>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-3 leading-relaxed">
                    These values are set by your assessment and updated when you reassess.
                </p>
            </section>

            {/* Reassessment eligibility */}
            <section className={`border rounded-xl p-6 shadow-sm ${reassessEligible ? 'bg-toneek-amber/10 border-toneek-amber/30' : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#222]'}`}>
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">
                    Update your assessment
                </p>
                {reassessEligible ? (
                    <>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                            Your skin profile can now be updated. If your condition, routine, or circumstances have changed, a new assessment will trigger a formula review.
                        </p>
                        <a
                            href="/assessment"
                            id="reassess-link"
                            className="inline-block px-5 py-2.5 bg-toneek-amber text-[#000000] rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            Start reassessment →
                        </a>
                    </>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        You can update your skin assessment from{' '}
                        <strong className="text-gray-800 dark:text-gray-300">{eligibleDateStr}</strong> — 6 weeks after your last assessment.
                    </p>
                )}
            </section>

        </div>
    )
}
