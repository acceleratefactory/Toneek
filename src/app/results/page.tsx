// src/app/results/page.tsx
// Displays the personalised formula after assessment completion.
// Reads the most recent assessment for the logged-in user.

import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const CLIMATE_LABELS: Record<string, string> = {
    humid_tropical: 'Hot and humid climate (tropical)',
    semi_arid: 'Hot and dry climate (semi-arid)',
    temperate_maritime: 'Mild, damp climate (temperate maritime)',
    cold_continental: 'Cold winters, humid summers (continental)',
    mediterranean: 'Hot dry summers, mild wet winters',
    equatorial: 'Extremely hot and humid (equatorial)',
}

const ROUTINE_MESSAGES: Record<string, string> = {
    just_one: 'Your Toneek formula is your treatment. Pair with a gentle cleanser and a plain moisturiser. Nothing else needed.',
    two_to_three: 'Use your Toneek formula as your treatment step. Add a simple cleanser and moisturiser only.',
    whatever_it_takes: 'Your Toneek formula is your active treatment step. If you use other products, apply them before your formula and wait 10 minutes.',
}

export default async function ResultsPage({
    searchParams,
}: {
    searchParams: Promise<{ assessment_id?: string }>
}) {
    const { assessment_id } = await searchParams

    let query = adminClient
        .from('skin_assessments')
        .select('*, formula_codes!formula_code(*)')
        .order('created_at', { ascending: false })
        .limit(1)

    if (assessment_id) {
        query = adminClient
            .from('skin_assessments')
            .select('*, formula_codes!formula_code(*)')
            .eq('id', assessment_id)
            .limit(1)
    }

    const { data, error } = await query.single()

    if (error || !data) {
        redirect('/assessment')
    }

    const assessment = data
    const formula = (data as any).formula_codes
    const actives: any[] = formula?.active_modules ?? []

    const routineMessage = ROUTINE_MESSAGES[assessment.routine_expectation] ??
        ROUTINE_MESSAGES.two_to_three

    return (
        <main className="results-page">
            <div className="results-container">
                {/* Header */}
                <div className="results-header">
                    <span className="brand">Toneek</span>
                    <h1 className="results-title">Your personalised formula is ready</h1>
                </div>

                {/* Skin OS Score */}
                <section className="score-section" aria-label="Skin OS Score">
                    <p className="score-label">Your Skin OS Score</p>
                    <p className="score-value" id="skin-os-score">{assessment.skin_os_score ?? '—'}</p>
                    <p className="score-hint">out of 100</p>
                </section>

                {/* Formula */}
                <section className="formula-section" aria-label="Formula details">
                    <p className="formula-code-label">Formula</p>
                    <p className="formula-code" id="formula-code">{assessment.formula_code}</p>
                    {formula?.profile_description && (
                        <p className="formula-description">{formula.profile_description}</p>
                    )}
                </section>

                {/* Climate note */}
                {assessment.climate_zone && (
                    <section className="climate-section">
                        <p className="section-label">Formulated for</p>
                        <p className="climate-value">
                            {CLIMATE_LABELS[assessment.climate_zone] ?? assessment.climate_zone}
                        </p>
                    </section>
                )}

                {/* Active ingredients */}
                {actives.length > 0 && (
                    <section className="actives-section" aria-label="Active ingredients">
                        <p className="section-label">Why this formula for you</p>
                        <div className="actives-list">
                            {actives.map((active: any, i: number) => (
                                <div key={i} className="active-card">
                                    <div className="active-header">
                                        <span className="active-name">{active.name}</span>
                                        <span className="active-concentration">{active.concentration}{active.unit}</span>
                                    </div>
                                    <p className="active-rationale">{active.rationale}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Timeline */}
                {formula?.outcome_timeline_weeks && (
                    <section className="timeline-section" aria-label="Expected timeline">
                        <p className="section-label">What to expect</p>
                        <div className="timeline">
                            {formula.week_2_expectation && (
                                <div className="timeline-item">
                                    <span className="week-label">Week 2</span>
                                    <span className="week-text">{formula.week_2_expectation}</span>
                                </div>
                            )}
                            {formula.week_4_expectation && (
                                <div className="timeline-item">
                                    <span className="week-label">Week 4</span>
                                    <span className="week-text">{formula.week_4_expectation}</span>
                                </div>
                            )}
                            {formula.week_8_expectation && (
                                <div className="timeline-item">
                                    <span className="week-label">Week {formula.outcome_timeline_weeks}</span>
                                    <span className="week-text">{formula.week_8_expectation}</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Routine instruction */}
                <section className="routine-section" aria-label="How to use">
                    <p className="section-label">How to use your formula</p>
                    <p className="routine-message">{routineMessage}</p>
                </section>

                {/* Isotretinoin warning */}
                {assessment.isotretinoin_flag && (
                    <section className="warning-section" role="alert">
                        <p className="warning-title">⚠ Isotretinoin note</p>
                        <p className="warning-text">
                            Because you are on isotretinoin, your formula has been adjusted to exclude any exfoliating acids.
                            Your formula is safe to use alongside your prescription.
                            Always confirm with your prescribing doctor.
                        </p>
                    </section>
                )}

                {/* CTA */}
                <section className="cta-section">
                    <p className="cta-label">Ready to get your formula made?</p>
                    <a id="subscribe-cta" href="/subscribe" className="btn-primary">
                        Subscribe and get your formula
                    </a>
                    <p className="cta-hint">
                        Payment by bank transfer only. Your formula is made to order once payment is confirmed.
                    </p>
                </section>
            </div>
        </main>
    )
}
