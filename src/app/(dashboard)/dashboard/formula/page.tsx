// src/app/(dashboard)/dashboard/formula/page.tsx
// My Formula view — shows the customer's current and previous formulas.
// Reads from skin_assessments joined with formula_codes.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ScoreSparkline from '@/components/dashboard/ScoreSparkline'

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

    // Fetch all assessments for this user, newest first
    const { data: assessments, error: fetchError } = await supabase
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
    const { data: outcomes } = await supabase
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Header ── */}
            <div>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f5f5f5', marginBottom: '0.2rem' }}>
                    My Formula
                </h1>
                {previous.length > 0 && (
                    <p style={{ color: '#666', fontSize: '0.8rem' }}>
                        Updated {new Date(latest.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                )}
            </div>

            {/* ── Skin OS Score ── */}
            <section
                aria-label="Skin OS Score"
                style={{
                    background: '#1a1a1a',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    padding: '1.5rem',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                            Skin OS Score
                        </p>
                        <p id="skin-os-score" style={{ fontSize: '3.5rem', fontWeight: 800, color: scoreColour(currentScore), lineHeight: 1, marginBottom: '0.25rem' }}>
                            {currentScore}
                        </p>
                        <p style={{ color: scoreColour(currentScore), fontSize: '0.85rem', fontWeight: 600 }}>
                            {scoreLabel(currentScore)}
                        </p>
                        <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.2rem' }}>out of 100</p>
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
                style={{
                    background: '#1a1a1a',
                    border: '1px solid #222',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                }}
            >
                <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    Your formula
                </p>
                <p id="formula-code" style={{ fontWeight: 700, fontSize: '1.4rem', color: '#f5f5f5', marginBottom: '0.2rem' }}>
                    {latest.formula_code}
                </p>
                {formula?.profile_description && (
                    <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: '1.4' }}>
                        {formula.profile_description}
                    </p>
                )}
                {latest.climate_zone && (
                    <p style={{ color: '#666', fontSize: '0.82rem', marginTop: '0.75rem' }}>
                        <span style={{ color: '#555' }}>Formulated for </span>
                        {CLIMATE_DESCRIPTIONS[latest.climate_zone] ?? latest.climate_zone}
                    </p>
                )}
            </section>

            {/* ── Why this formula ── */}
            {latest.formula_rationale && (
                <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                    <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
                        Why this formula for you
                    </p>
                    <p style={{ color: '#ccc', fontSize: '0.88rem', lineHeight: '1.6' }}>
                        {latest.formula_rationale}
                    </p>
                </section>
            )}

            {/* ── Active ingredients ── */}
            {actives.length > 0 && (
                <section aria-label="Active ingredients" style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                    <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                        Active ingredients
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {actives.map((active: any, i: number) => (
                            <div key={i} style={{
                                background: '#222',
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '1rem',
                            }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: '#f5f5f5', fontSize: '0.92rem', marginBottom: '0.2rem' }}>
                                        {active.name}
                                    </p>
                                    {active.rationale && (
                                        <p style={{ color: '#888', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                            {active.rationale}
                                        </p>
                                    )}
                                </div>
                                <span style={{
                                    color: '#d4a574', fontWeight: 700, fontSize: '0.9rem',
                                    flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                                }}>
                                    {active.concentration}{active.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Expected timeline ── */}
            <section aria-label="Expected timeline" style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                    What to expect
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
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
                                <div style={{ paddingTop: '0.25rem', flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: done ? '#4caf82' : '#888', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                                        Week {item.week}
                                        {done && outcome?.improvement_score && (
                                            <span style={{ fontWeight: 400, color: '#4caf82', marginLeft: '0.5rem' }}>
                                                — score {outcome.improvement_score}/10
                                            </span>
                                        )}
                                    </p>
                                    <p style={{ color: '#666', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* ── Reformulation eligibility ── */}
            <section style={{
                background: isEligible ? 'rgba(212,165,116,0.06)' : '#1a1a1a',
                border: `1px solid ${isEligible ? 'rgba(212,165,116,0.3)' : '#222'}`,
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
            }}>
                <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    Formula review
                </p>
                {isEligible ? (
                    <>
                        <p style={{ color: '#d4a574', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.5rem' }}>
                            Your formula is eligible for review
                        </p>
                        <p style={{ color: '#888', fontSize: '0.82rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                            Six weeks of data allows us to refine your formula based on your skin's response.
                        </p>
                        <a
                            href="/assessment"
                            id="start-reassessment"
                            style={{
                                display: 'inline-block',
                                padding: '0.65rem 1.25rem',
                                background: '#d4a574',
                                color: '#0f0f0f',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                            }}
                        >
                            Update my skin assessment →
                        </a>
                    </>
                ) : (
                    <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: '1.5' }}>
                        Your formula can be reviewed and updated from <strong style={{ color: '#888' }}>{eligibleDateStr}</strong> — after 6 weeks of use.
                    </p>
                )}
            </section>

            {/* ── Previous formulas (collapsible) ── */}
            {previous.length > 0 && (
                <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                    <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                        Formula history
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {previous.map((prev, i) => (
                            <div key={prev.id} style={{
                                background: '#222', borderRadius: '8px', padding: '0.75rem 1rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <p style={{ color: '#888', fontWeight: 600, fontSize: '0.88rem' }}>{prev.formula_code}</p>
                                    <p style={{ color: '#555', fontSize: '0.75rem' }}>
                                        {new Date(prev.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <span style={{ color: '#555', fontSize: '0.8rem' }}>
                                    Score: {prev.skin_os_score ?? '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </div>
    )
}
