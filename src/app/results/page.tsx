// src/app/results/page.tsx
// Displays the personalised formula after assessment completion.
// Reads the most recent assessment for the logged-in user.

import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AnimatedScoreRing from '@/components/formula/AnimatedScoreRing'
import MetricGrid from '@/components/formula/MetricGrid'
import FormulaCard from '@/components/formula/FormulaCard'
import IngredientCard from '@/components/formula/IngredientCard'
import CheckinTimeline from '@/components/formula/CheckinTimeline'

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

    // active_modules may be stored as a nested array e.g. [[a, b, c]] — flatten to guarantee a flat list
    const rawActives = formula?.active_modules ?? []
    const actives: any[] = Array.isArray(rawActives[0]) ? rawActives.flat() : rawActives


    const routineMessage = ROUTINE_MESSAGES[assessment.routine_expectation] ??
        ROUTINE_MESSAGES.two_to_three

    const pathPills = [
        assessment.city || 'Location',
        assessment.skin_type || 'Variable',
        assessment.primary_concern?.replace(/_/g, ' ') || 'Skin health'
    ]

    // Construct static timeline nodes for preview
    const customW2 = formula?.week_2_expectation || formula?.base_formula?.week_2_expectation || 'Skin inflammation calming, barrier beginning to stabilise.'
    const customW4 = formula?.week_4_expectation || formula?.base_formula?.week_4_expectation || 'Visible improvement beginning — uneven tone starting to lift.'
    const customW8 = formula?.week_8_expectation || formula?.base_formula?.week_8_expectation || 'Measurable change in primary concern. Skin OS Score recalculated.'

    const timelineNodes = [
        { week: 2, state: 'PENDING' as const, description: customW2 },
        { week: 4, state: 'PENDING' as const, description: customW4 },
        { week: formula?.outcome_timeline_weeks || 8, state: 'PENDING' as const, description: customW8 }
    ]

    // Determine the photo URL (supbabase storage URL vs raw)
    let photoUrl = assessment.intake_photo_url
    if (photoUrl && !photoUrl.startsWith('http')) {
        const cleanPath = photoUrl.replace(/^checkin-photos\//, '').replace(/^\//, '')
        const { data } = adminClient.storage.from('checkin-photos').getPublicUrl(cleanPath)
        photoUrl = data?.publicUrl || photoUrl // fallback to raw string if generation completely fails
    }

    return (
        <main className="min-h-screen bg-[#FCFAF8] dark:bg-[#1A1210] py-12 px-4 sm:px-6 font-sans overflow-x-hidden">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* 1. Header (0ms) */}
                <div className="flex flex-col items-center text-center mb-10 animate-slide-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
                    <img src="/logo.svg" alt="Toneek" className="h-10 w-auto mb-6 dark:hidden" />
                    <img src="/logo-dark.svg" alt="Toneek" className="h-10 w-auto mb-6 hidden dark:block" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your Skin OS Framework</h1>
                    <p className="text-gray-500 dark:text-[#A3938C] text-sm">Real-time clinical intelligence mapping</p>
                </div>

                {/* 2. Main Score Ring (200ms) alongside Assessment Photo */}
                <section className="bg-white dark:bg-[#261B18] border border-gray-100 dark:border-[#3A2820] rounded-2xl p-8 sm:p-12 text-center shadow-sm relative animate-slide-up opacity-0 flex flex-col md:flex-row items-center justify-center gap-12" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                    
                    {photoUrl && (
                        <div className="flex flex-col items-center w-32 md:w-40 flex-shrink-0">
                           <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[#F7F1EB] dark:border-[#302420] shadow-inner mb-3">
                               <img src={photoUrl} alt="Assessment Intake" className="w-full h-full object-cover" />
                           </div>
                           <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold font-sans">Baseline Photo</p>
                        </div>
                    )}
                    
                    <div className="flex flex-col items-center">
                        <p className="text-gray-500 dark:text-[#A3938C] text-[11px] font-bold uppercase tracking-[0.15em] mb-4 font-sans">
                            Skin OS Score
                        </p>
                        <AnimatedScoreRing 
                            score={assessment.skin_os_score ?? 50} 
                            size={200}
                            label="Initial Assessment" 
                            delay={200}
                        />
                    </div>
                </section>

                {/* 3. Metric Grid (400ms) */}
                <MetricGrid assessment={assessment} delayMs={400} />

                {/* 4. Formula Card (800ms) */}
                <FormulaCard 
                    formulaCode={assessment.formula_code || 'TNK-0X'}
                    formulaName={formula?.profile_description || 'Custom Clinical Formulation'}
                    formulaRationale={assessment.formula_rationale}
                    climateZone={CLIMATE_LABELS[assessment.climate_zone] ?? assessment.climate_zone ?? 'Your Climate'}
                    pathPills={pathPills}
                    delayMs={800}
                />

                {/* 5. Active Ingredients (1000ms staggered) */}
                {actives.length > 0 && (
                    <section className="mt-8 animate-slide-up opacity-0" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
                        <p className="text-gray-500 dark:text-[#A3938C] text-[11px] font-bold uppercase tracking-[0.15em] mb-4 font-sans">
                            Bio-active Modules
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {actives.map((active: any, i: number) => {
                                // Provide fallback max limits for calculating bar width
                                const maxLimits: Record<string, number> = {
                                    'Niacinamide': 10, 'Azelaic Acid': 15, 'Salicylic Acid': 2,
                                    'Tranexamic Acid': 5, 'Bakuchiol': 2, 'Kojic Acid': 2,
                                    'Centella Asiatica': 5, 'Peptide Blend': 5
                                }
                                const maxSafe = maxLimits[active.name] || 10
                                
                                return (
                                    <IngredientCard 
                                        key={i}
                                        name={active.name}
                                        role={active.role || 'TARGETED ACTIVE'}
                                        concentration={parseFloat(active.concentration) || 0}
                                        maxSafeLimit={maxSafe}
                                        rationale={active.rationale}
                                        delayMs={1000 + (Math.floor(i) * 120)}
                                    />
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* 6. Expected Timeline (1400ms) */}
                {timelineNodes.length > 0 && (
                    <section className="bg-white dark:bg-[#1A1210] border border-gray-100 dark:border-[#3A2820] rounded-2xl p-6 sm:p-8 mt-6 animate-slide-up opacity-0 shadow-sm" style={{ animationDelay: '1400ms', animationFillMode: 'forwards' }}>
                        <p className="text-gray-500 dark:text-[#A3938C] text-[11px] font-bold uppercase tracking-[0.15em] mb-4 font-sans">
                            Clinical Trajectory
                        </p>
                        <CheckinTimeline nodes={timelineNodes} delayMs={1400} />
                    </section>
                )}

                {/* Routine & Warnings */}
                <div className="grid sm:grid-cols-2 gap-4 animate-slide-up opacity-0" style={{ animationDelay: '1600ms', animationFillMode: 'forwards' }}>
                    <section className="bg-white dark:bg-[#261B18] border border-gray-100 dark:border-[#3A2820] rounded-xl p-6 shadow-sm">
                        <p className="text-gray-500 dark:text-[#A3938C] text-[10px] font-bold uppercase tracking-[0.15em] mb-3">Protocol</p>
                        <p className="text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed font-medium font-sans">{routineMessage}</p>
                    </section>
                    
                    {assessment.isotretinoin_flag && (
                        <section className="bg-red-50 dark:bg-[#321B19] border border-red-100 dark:border-[#4B221E] rounded-xl p-6 shadow-sm">
                            <p className="text-red-700 dark:text-[#D05C51] font-bold text-xs uppercase tracking-wider mb-2">⚠ Isotretinoin Safety</p>
                            <p className="text-red-600 dark:text-[#E0A29C] text-xs leading-relaxed font-sans">
                                Because you are on isotretinoin, your formula has been adjusted to strictly exclude all exfoliating acids. Safe for use alongside prescription.
                            </p>
                        </section>
                    )}
                </div>

                {/* 7. CTA (1800ms) */}
                <section className="pt-8 text-center animate-slide-up opacity-0" style={{ animationDelay: '1800ms', animationFillMode: 'forwards' }}>
                    <p className="text-gray-900 dark:text-[#F0E6DF] font-bold text-[22px] mb-6 font-sans tracking-tight">Ready to initiate your sequence?</p>
                    <a href={`/subscribe?assessment_id=${assessment.id}`} className="inline-block bg-[#2A0F06] hover:bg-[#3D1A0E] text-white font-medium py-3.5 mx-auto px-10 rounded-lg shadow-xl shadow-toneek-brown/20 transition-all font-sans text-lg w-full sm:w-auto">
                        Subscribe and get your formula
                    </a>
                    <p className="text-gray-400 dark:text-[#A3938C] text-xs mt-5 max-w-sm mx-auto font-sans">
                        Requires bank transfer completion. Custom compounds are synthesized immediately upon verification.
                    </p>
                </section>
            </div>
        </main>
    )
}
