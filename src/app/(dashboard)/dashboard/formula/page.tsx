// src/app/(dashboard)/dashboard/formula/page.tsx
// My Formula view — shows the customer's current and previous formulas.
// Reads from skin_assessments joined with formula_codes.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ScoreSparkline from '@/components/dashboard/ScoreSparkline'
import { adminClient } from '@/lib/supabase/admin'

export const metadata = {
    title: 'My Formula — Toneek',
}

// ─── Score colour coding ──────────────────────────────────────────────────────

function scoreColour(score: number): string {
    if (score >= 80) return '#4caf82'   // excellent — green
    if (score >= 60) return '#d4a574'   // good progress — gold
    if (score >= 40) return '#e09a3a'   // early stage — amber
    return '#e05555'                     // needs attention — red
}

function scoreLabel(score: number): string {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good progress'
    if (score >= 40) return 'Early stage'
    return 'Needs attention'
}

// ─── Climate zone descriptions ────────────────────────────────────────────────

const CLIMATE_DESCRIPTIONS: Record<string, string> = {
    humid_tropical:      'humid tropical climates — lightweight base, full active concentrations',
    semi_arid:           'hot dry climates — extended moisture retention, barrier support',
    temperate_maritime:  'temperate maritime climates — balanced hydration, central-heating protection',
    cold_continental:    'cold continental climates — barrier-first formulation, cold-weather actives',
    mediterranean:       'mediterranean climates — seasonal adjustment built in',
    equatorial:          'equatorial climates — ultra-lightweight, sweat-resistant base',
}

// ─── Default timeline expectations ───────────────────────────────────────────

const TIMELINE: { week: number; description: string }[] = [
    { week: 2,  description: 'Skin inflammation calming, barrier beginning to stabilise.' },
    { week: 4,  description: 'Visible improvement beginning — uneven tone starting to lift.' },
    { week: 8,  description: 'Measurable change in primary concern. Skin OS Score recalculated.' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FormulaPage() {
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

    // Fetch user profile to check subscription status
    const { data: profile } = await adminClient
        .from('profiles')
        .select('subscription_status')
        .eq('id', session.user.id)
        .single()
    
    // Show the subscribe block only if they haven't subscribed or if they cancelled
    const needsSubscription = !profile?.subscription_status || profile.subscription_status === 'never' || profile.subscription_status === 'cancelled'

    // Fetch all assessments for this user, newest first
    const { data: assessments, error: fetchError } = await adminClient
        .from('skin_assessments')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

    if (fetchError) {
        console.error('Error fetching assessments:', fetchError.message)
    }

    if (!assessments || assessments.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ color: '#888' }}>No formula assigned yet.</p>
                <a href="/assessment" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
                    Start your assessment
                </a>
            </div>
        )
    }

    const latest     = assessments[0]
    const formula    = (latest as any).formula_codes
    const actives: any[] = latest.active_modules ?? formula?.active_modules ?? []
    const previous   = assessments.slice(1)

    // Fetch skin outcomes for sparkline
    const { data: outcomes } = await adminClient
        .from('skin_outcomes')
        .select('check_in_week, improvement_score, recorded_at, new_skin_os_score')
        .eq('user_id', session.user.id)
        .order('recorded_at', { ascending: true })

    // Reformulation eligibility — 6 weeks from assessment created_at
    const assessedAt       = new Date(latest.created_at)
    const eligibleAt       = new Date(assessedAt.getTime() + 42 * 24 * 60 * 60 * 1000)
    const isEligible       = new Date() >= eligibleAt
    const eligibleDateStr  = eligibleAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    // Sparkline data — baseline score + check-in scores
    const sparklinePoints = [
        { label: 'Start', score: latest.skin_os_score ?? 50 },
        ...(outcomes ?? []).map(o => ({
            label: `Wk ${o.check_in_week}`,
            score: o.new_skin_os_score ?? (o.improvement_score ? Math.min(100, (latest.skin_os_score ?? 50) + o.improvement_score) : null),
        })).filter(p => p.score !== null),
    ]

    const currentScore = latest.skin_os_score ?? 50

    return (
        <div className="flex flex-col gap-6 font-sans">
            {/* ── Top Header Banner (Zoho Style) ── */}
            <div className="bg-white dark:bg-[#261B18] pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 dark:border-[#3A2820] -mt-8 sm:-mt-8 mx-[-1rem] sm:mx-[-2rem] mb-2 relative pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Formula</h1>
                        {previous.length > 0 && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                Updated {new Date(latest.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Skin OS Score ── */}
            <section
                aria-label="Skin OS Score"
                className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm"
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">
                            Skin OS Score
                        </p>
                        <p id="skin-os-score" style={{ color: scoreColour(currentScore) }} className="text-5xl font-black mb-1">
                            {currentScore}
                        </p>
                        <p style={{ color: scoreColour(currentScore) }} className="text-sm font-bold">
                            {scoreLabel(currentScore)}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">out of 100</p>
                    </div>

                    {/* Sparkline if multiple data points */}
                    {sparklinePoints.length > 1 && (
                        <ScoreSparkline points={sparklinePoints} colour={scoreColour(currentScore)} />
                    )}
                </div>
            </section>

            {/* ── Formula identity ── */}
            <section
                aria-label="Formula details"
                className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm"
            >
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">
                    Your formula
                </p>
                <p id="formula-code" className="font-mono font-bold text-2xl text-toneek-brown dark:text-gray-100 mb-2">
                    {latest.formula_code}
                </p>
                {formula?.profile_description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {formula.profile_description}
                    </p>
                )}
                {latest.climate_zone && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-3">
                        <span>Formulated for </span>
                        {CLIMATE_DESCRIPTIONS[latest.climate_zone] ?? latest.climate_zone}
                    </p>
                )}
            </section>

            {/* ── Why this formula ── */}
            {latest.formula_rationale && (
                <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">
                        Why this formula for you
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {latest.formula_rationale}
                    </p>
                </section>
            )}

            {/* ── Active ingredients ── */}
            {actives.length > 0 && (
                <section aria-label="Active ingredients" className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-4 font-bold">
                        Active ingredients
                    </p>
                    <div className="flex flex-col gap-3">
                        {actives.map((active: any, i: number) => (
                            <div key={i} className="bg-gray-50 dark:bg-[#222] rounded-lg p-4 flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">
                                        {active.name}
                                    </p>
                                    {active.rationale && (
                                        <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                                            {active.rationale}
                                        </p>
                                    )}
                                </div>
                                <span className="text-toneek-amber font-mono font-bold text-sm flex-shrink-0">
                                    {active.concentration}{active.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Expected timeline ── */}
            <section aria-label="Expected timeline" className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-4 font-bold">
                    What to expect
                </p>
                <div className="flex flex-col gap-0">
                    {TIMELINE.map((item, i) => {
                        const outcome = outcomes?.find(o => o.check_in_week === item.week)
                        const done = !!outcome
                        return (
                            <div key={item.week} style={{
                                display: 'flex',
                                gap: '1rem',
                                paddingBottom: i < TIMELINE.length - 1 ? '1rem' : 0,
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: '28px', height: '28px',
                                        borderRadius: '50%',
                                        background: done ? '#4caf82' : '#222',
                                        border: `2px solid ${done ? '#4caf82' : '#333'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.75rem', color: done ? '#fff' : '#555',
                                        flexShrink: 0,
                                    }}>
                                        {done ? '✓' : item.week}
                                    </div>
                                    {i < TIMELINE.length - 1 && (
                                        <div style={{ width: '1px', flex: 1, background: '#2a2a2a', minHeight: '24px' }} />
                                    )}
                                </div>
                                <div className="pt-1 flex-1">
                                    <p className={`font-bold text-sm mb-1 ${done ? 'text-toneek-forest' : 'text-gray-500 dark:text-gray-400'}`}>
                                        Week {item.week}
                                        {done && outcome?.improvement_score && (
                                            <span className="font-normal text-toneek-forest ml-2">
                                                — score {outcome.improvement_score}/10
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* ── Reformulation eligibility ── */}
            <section className={`border rounded-xl p-6 shadow-sm ${isEligible ? 'bg-toneek-amber/10 border-toneek-amber/30' : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#222]'}`}>
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">
                    Formula review
                </p>
                {isEligible ? (
                    <>
                        <p className="text-toneek-amber font-bold text-sm mb-2">
                            Your formula is eligible for review
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                            Six weeks of data allows us to refine your formula based on your skin's response.
                        </p>
                        <a
                            href="/assessment"
                            id="start-reassessment"
                            className="inline-block px-5 py-2.5 bg-toneek-amber text-[#000000] rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            Update my skin assessment →
                        </a>
                    </>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        Your formula can be reviewed and updated from <strong className="text-gray-800 dark:text-gray-300">{eligibleDateStr}</strong> — after 6 weeks of use.
                    </p>
                )}
            </section>

            {/* ── Previous formulas (collapsible) ── */}
            {previous.length > 0 && (
                <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-4 font-bold">
                        Formula history
                    </p>
                    <div className="flex flex-col gap-2">
                        {previous.map((prev, i) => (
                            <div key={prev.id} className="bg-gray-50 dark:bg-[#222] rounded-lg p-3 flex justify-between items-center px-4">
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300 font-bold text-sm">{prev.formula_code}</p>
                                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">
                                        {new Date(prev.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    Score: {prev.skin_os_score ?? '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Subscribe Call to Action ── */}
            {needsSubscription && (
                <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-8 shadow-sm text-center">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-6">
                        Ready to get your formula made?
                    </p>
                    <a
                        href="/subscribe"
                        className="inline-block px-8 py-3 bg-[#382218] hover:bg-[#2A1911] text-white rounded-lg font-bold transition-opacity shadow-sm"
                    >
                        Subscribe and get your formula
                    </a>
                    <p className="text-[#a1a1aa] dark:text-gray-500 text-[10px] mt-4 uppercase tracking-wider">
                        Payment by bank transfer only. Your formula is made to order once payment is confirmed.
                    </p>
                </section>
            )}

        </div>
    )
}
