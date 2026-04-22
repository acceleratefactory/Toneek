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
        <main className="min-h-screen bg-[#FCFAF8] dark:bg-[#1A1210] py-12 px-4 sm:px-6 font-sans">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-10">
                    <img src="/logo.svg" alt="Toneek" className="h-12 w-auto mb-4 dark:hidden" />
                    <img src="/logo-dark.svg" alt="Toneek" className="h-12 w-auto mb-4 hidden dark:block" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your personalised formula is ready</h1>
                </div>

                {/* Skin OS Score */}
                <section className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-2xl p-10 text-center shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Your Skin OS Score</p>
                    <p className="text-7xl font-black tracking-tighter text-toneek-amber">{assessment.skin_os_score ?? '—'}</p>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.1em] mt-2">out of 100</p>
                </section>

                {/* Formula */}
                <section className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-2xl p-8 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">Formula</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono tracking-tight">{assessment.formula_code}</p>
                    {formula?.profile_description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 leading-relaxed">{formula.profile_description}</p>
                    )}
                </section>

                {/* Climate note */}
                {assessment.climate_zone && (
                    <section className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-2xl p-8 shadow-sm">
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">Formulated for</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {CLIMATE_LABELS[assessment.climate_zone] ?? assessment.climate_zone}
                        </p>
                    </section>
                )}

                {/* Active ingredients */}
                {actives.length > 0 && (
                    <section className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-2xl p-8 shadow-sm">
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-6">Why this formula for you</p>
                        <div className="flex flex-col gap-3">
                            {actives.map((active: any, i: number) => (
                                <div key={i} className="bg-toneek-amber/10 dark:bg-toneek-amber/5 border-l-4 border-toneek-amber p-4 rounded-r-lg">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{active.name}</span>
                                        <span className="text-xs font-bold text-toneek-brown dark:text-toneek-amber">{active.concentration}{active.unit}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{active.rationale}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Timeline */}
                {formula?.outcome_timeline_weeks && (
                    <section className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-2xl p-8 shadow-sm">
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-6">What to expect</p>
                        <div className="flex flex-col gap-4 relative before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-gray-200 dark:before:bg-[#333]">
                            {formula.week_2_expectation && (
                                <div className="relative pl-8">
                                    <div className="absolute left-[5px] top-1.5 w-2 h-2 rounded-full bg-toneek-amber"></div>
                                    <span className="block text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">Week 2</span>
                                    <span className="block text-sm text-gray-600 dark:text-gray-400">{formula.week_2_expectation}</span>
                                </div>
                            )}
                            {formula.week_4_expectation && (
                                <div className="relative pl-8">
                                    <div className="absolute left-[5px] top-1.5 w-2 h-2 rounded-full bg-toneek-amber"></div>
                                    <span className="block text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">Week 4</span>
                                    <span className="block text-sm text-gray-600 dark:text-gray-400">{formula.week_4_expectation}</span>
                                </div>
                            )}
                            {formula.week_8_expectation && (
                                <div className="relative pl-8">
                                    <div className="absolute left-[5px] top-1.5 w-2 h-2 rounded-full bg-toneek-amber"></div>
                                    <span className="block text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">Week {formula.outcome_timeline_weeks}</span>
                                    <span className="block text-sm text-gray-600 dark:text-gray-400">{formula.week_8_expectation}</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Routine instruction */}
                <section className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-2xl p-8 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">How to use your formula</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{routineMessage}</p>
                </section>

                {/* Isotretinoin warning */}
                {assessment.isotretinoin_flag && (
                    <section className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-2xl p-6 shadow-sm">
                        <p className="text-red-700 dark:text-red-400 font-bold text-sm mb-2">⚠ Isotretinoin note</p>
                        <p className="text-red-600 dark:text-red-300 text-xs leading-relaxed">
                            Because you are on isotretinoin, your formula has been adjusted to exclude any exfoliating acids.
                            Your formula is safe to use alongside your prescription.
                            Always confirm with your prescribing doctor.
                        </p>
                    </section>
                )}

                {/* CTA */}
                <section className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-2xl p-10 text-center shadow-sm">
                    <p className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-6">Ready to get your formula made?</p>
                    <a id="subscribe-cta" href={`/subscribe?assessment_id=${assessment.id}`} className="inline-block bg-[#3A2820] hover:bg-[#2A1D17] text-white font-bold py-3.5 mx-auto px-8 w-full sm:w-auto rounded-lg transition-colors">
                        Subscribe and get your formula
                    </a>
                    <p className="text-gray-400 text-[11px] mt-4 max-w-sm mx-auto">
                        Payment by bank transfer only. Your formula is made to order once payment is confirmed.
                    </p>
                </section>
            </div>
        </main>
    )
}
