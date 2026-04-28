// src/app/results/page.tsx
// Displays the personalised formula after assessment completion.
// Reads the most recent assessment for the logged-in user.

import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AnimatedScoreRing from '@/components/formula/AnimatedScoreRing'
import MetricGrid from '@/components/formula/MetricGrid'
import FormulaCard from '@/components/formula/FormulaCard'
import DecisionConfidence from '@/components/formula/DecisionConfidence'
import BehaviouralProtocol from '@/components/formula/BehaviouralProtocol'
import RiskFlags from '@/components/formula/RiskFlags'
import IngredientCard from '@/components/formula/IngredientCard'
import CheckinTimeline from '@/components/formula/CheckinTimeline'
import SystemLearningDisclosure from '@/components/formula/SystemLearningDisclosure'
import RealOutcomes from '@/components/formula/RealOutcomes'
import StickyCTA from '@/components/formula/StickyCTA'
import { generateProtocol } from '@/lib/protocol/generateProtocol'
import { generateFormulaLogic } from '@/lib/formula/generateFormulaLogic'
import { getIdentityLine, getFormulaSummaryLine } from '@/lib/formula/identityLine'

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

    // Generate the behavioural protocol for this formula
    const protocol = generateProtocol(
        assessment.formula_code || '',
        assessment.formula_tier,
        actives,
        assessment.pregnant_or_breastfeeding,
    )

    // Generate the formula logic explanation paragraphs
    const logicParagraphs = generateFormulaLogic({
        climate_zone:    assessment.climate_zone,
        skin_type:       assessment.skin_type,
        primary_concern: assessment.primary_concern,
        formula_tier:    assessment.formula_tier,
        city:            assessment.city,
    })


    const routineMessage = ROUTINE_MESSAGES[assessment.routine_expectation] ??
        ROUTINE_MESSAGES.two_to_three

    const pathPills = [
        assessment.city || 'Location',
        assessment.skin_type || 'Variable',
        assessment.primary_concern?.replace(/_/g, ' ') || 'Skin health'
    ]

    // Construct static timeline nodes for preview
    const customW2 = formula?.week_2_expectation || formula?.base_formula?.week_2_expectation || 'Skin inflammation calming, barrier beginning to stabilise. No visible pigment change at this stage — this is normal.'

    // Personalise Week 4 by primary concern (per clinical OS upgrade spec)
    const concern = assessment.primary_concern || ''
    let customW4 = formula?.week_4_expectation || formula?.base_formula?.week_4_expectation
    if (!customW4) {
        if (concern === 'PIH' || concern === 'tone') {
            customW4 = 'Tone beginning to even. First visible lightening of surface pigmentation.'
        } else if (concern === 'acne') {
            customW4 = 'Breakout frequency reducing. PIH marks static or beginning to fade.'
        } else if (concern === 'dryness') {
            customW4 = 'Barrier measurably more resilient. Tightness significantly reduced.'
        } else if (concern === 'sensitivity') {
            customW4 = 'Reactivity reducing. Barrier calming — skin becoming more tolerant of daily environmental exposure.'
        } else if (concern === 'oiliness') {
            customW4 = 'Sebum regulation beginning. Midday shine reducing — pore appearance improving.'
        } else {
            customW4 = 'Visible improvement beginning — primary concern starting to respond to treatment.'
        }
    }

    const customW8 = formula?.week_8_expectation || formula?.base_formula?.week_8_expectation || 'Measurable change in primary concern. Skin OS Score recalculated from your Week 8 check-in.'

    // Check formula_performance for learning mode (200+ outcome records = data-backed mode)
    const { count: formulaOutcomeCount } = await adminClient
        .from('skin_outcomes')
        .select('id', { count: 'exact', head: true })
        .eq('formula_code', assessment.formula_code)

    const isColdStart = (formulaOutcomeCount ?? 0) < 200
    const coldStartNote = isColdStart
        ? 'Based on clinical evidence for your active ingredients. Probability data updates as outcomes are collected.'
        : undefined

    // Clinical evidence notes per week (from toneek_final_five_upgrades.md)
    const w2EvidenceNote = 'Most users on this formula feel noticeably calmer skin by Day 10. This timeline is consistent with clinical evidence for FST IV–VI skin.'

    let w4EvidenceNote: string
    if (concern === 'PIH' || concern === 'tone') {
        w4EvidenceNote = 'Visible tone improvement begins here for most users — 65–72% of FST IV–VI patients on targeted brightening actives see measurable change at Week 4.'
    } else if (concern === 'acne') {
        w4EvidenceNote = 'Clinical evidence: targeted anti-acne combinations show 60–75% reduction in active lesions by Week 4 in melanin-rich skin studies.'
    } else if (concern === 'dryness' || concern === 'sensitivity') {
        w4EvidenceNote = 'Barrier repair measurable at 4 weeks for most users on this protocol. Clinical confirmation for Centella at 5% in compromised FST IV–VI skin.'
    } else {
        w4EvidenceNote = 'Clinical evidence: targeted active combinations for your concern show measurable improvement in 60–70% of patients at Week 4.'
    }

    const w8EvidenceNote = 'Your primary clinical milestone. 70–78% of FST IV–VI patients on targeted active combinations achieve measurable improvement by Week 8.'

    const timelineNodes = [
        { week: 2, state: 'PENDING' as const, description: customW2, evidenceNote: w2EvidenceNote },
        { week: 4, state: 'PENDING' as const, description: customW4, evidenceNote: w4EvidenceNote },
        { week: formula?.outcome_timeline_weeks || 8, state: 'PENDING' as const, description: customW8, evidenceNote: w8EvidenceNote }
    ]

    // Determine the photo URL (supbabase storage URL vs raw)
    let photoUrl = assessment.intake_photo_url
    if (photoUrl && !photoUrl.startsWith('http')) {
        const cleanPath = photoUrl.replace(/^checkin-photos\//, '').replace(/^\//, '')
        const { data } = adminClient.storage.from('checkin-photos').getPublicUrl(cleanPath)
        photoUrl = data?.publicUrl || photoUrl // fallback to raw string if generation completely fails
    }

    // Query prediction_log count for this profile_segment (used by DecisionConfidence)
    const profileSegment = assessment.profile_segment || ''
    const { count: profileCount } = await adminClient
        .from('prediction_log')
        .select('id', { count: 'exact', head: true })
        .eq('profile_segment', profileSegment)

    // Query formula_performance for this formula_code (used by RealOutcomes)
    const { data: formulaPerformance } = await adminClient
        .from('formula_performance')
        .select('success_rate, avg_improvement_score, total_customers')
        .eq('formula_code', assessment.formula_code || '')
        .limit(1)
        .single()

    // Compute comparative percentiles from prediction_log for this profile_segment
    // Only attempt when enough records exist (reuse profileCount from above)
    let comparativeData: Record<string, number> | null = null
    if ((profileCount ?? 0) >= 50) {
        const { data: peerScores } = await adminClient
            .from('prediction_log')
            .select('analysis_scores')
            .eq('profile_segment', profileSegment)
            .not('analysis_scores', 'is', null)
            .limit(500)

        if (peerScores && peerScores.length >= 50) {
            const myScores = assessment.analysis_scores as Record<string, number> | null
            if (myScores) {
                const METRIC_KEYS: [string, string][] = [
                    ['BARRIER INTEGRITY',    'barrier_integrity'],
                    ['TREATMENT TOLERANCE',  'treatment_tolerance'],
                    ['CLIMATE STRESS',       'climate_stress'],
                    ['MELANIN SENSITIVITY',  'melanin_sensitivity'],
                    ['PIGMENTATION LOAD',    'pigmentation_load'],
                    ['OIL BALANCE',          'oil_balance'],
                    ['INFLAMMATION LEVEL',   'inflammation_level'],
                    ['HYDRATION STATUS',     'hydration_status'],
                ]
                comparativeData = {}
                for (const [cardTitle, scoreKey] of METRIC_KEYS) {
                    const myVal = myScores[scoreKey]
                    if (myVal === undefined) continue
                    const peers = peerScores
                        .map((r: any) => r.analysis_scores?.[scoreKey])
                        .filter((v: any): v is number => typeof v === 'number')
                    if (peers.length < 10) continue
                    const below = peers.filter(v => v < myVal).length
                    comparativeData[cardTitle] = Math.round((below / peers.length) * 100)
                }
            }
        }
    }

    // Emotional forecast — for results page Clinical Trajectory section
    const barrierIntegrity: number = (assessment.analysis_scores as any)?.barrier_integrity ?? 60
    const resultsBarrierColour = barrierIntegrity >= 70 ? '#1C5C3A' : '#C87D3E'
    let resultsEmotionalText: string
    if (barrierIntegrity >= 80) {
        const concern = assessment.primary_concern || 'Your primary concern'
        resultsEmotionalText = `${concern} is the formula's primary target — your barrier is already working well for you.`
    } else {
        resultsEmotionalText = 'Your formula stabilises the barrier first. This is the foundation for lasting improvement.'
    }

    return (
        <>
        <main className="min-h-screen bg-[#FCFAF8] dark:bg-[#1A1210] py-12 px-4 sm:px-6 font-sans overflow-x-hidden">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* 1. Header (0ms) */}
                <div className="flex flex-col items-center text-center mb-10 animate-slide-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
                    <img src="/logo.svg" alt="Toneek" className="h-10 w-auto mb-6 dark:hidden" />
                    <img src="/logo-dark.svg" alt="Toneek" className="h-10 w-auto mb-6 hidden dark:block" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Your Skin OS Framework</h1>
                    <p className="text-[14px] font-normal text-[#8C7B72] dark:text-[#A3938C]" style={{ fontFamily: 'Jost, sans-serif' }}>
                        {getIdentityLine(assessment.climate_zone, assessment.skin_type)}
                    </p>
                </div>

                {/* 2. Main Score Ring (200ms) alongside Assessment Photo */}
                <section id="sticky-cta-trigger" className="bg-white dark:bg-[#261B18] border border-gray-100 dark:border-[#3A2820] rounded-2xl p-8 sm:p-12 text-center shadow-sm relative animate-slide-up opacity-0 flex flex-col md:flex-row items-center justify-center gap-12" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                    
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
                <MetricGrid assessment={assessment} delayMs={400} comparativeData={comparativeData} />

                {/* 4. Formula Card (800ms) */}
                <FormulaCard 
                    formulaCode={assessment.formula_code || 'TNK-0X'}
                    formulaName={formula?.profile_description || 'Custom Clinical Formulation'}
                    formulaRationale={assessment.formula_rationale}
                    climateZone={CLIMATE_LABELS[assessment.climate_zone] ?? assessment.climate_zone ?? 'Your Climate'}
                    pathPills={pathPills}
                    logicParagraphs={logicParagraphs}
                    summaryLine={getFormulaSummaryLine(assessment.formula_tier, assessment.climate_zone, assessment.primary_concern)}
                    delayMs={800}
                />

                <DecisionConfidence
                    confidenceScore={assessment.confidence_score ?? 0.6}
                    profileCount={profileCount ?? 0}
                    outcomeCount={profileCount ?? 0}
                    variant="results"
                    delayMs={900}
                />

                {/* 4c. Behavioural Protocol (1000ms) */}
                <BehaviouralProtocol
                    protocol={protocol}
                    delayMs={1000}
                />

                {/* 4d. Risk Flags (1100ms) — conditional, only shown if flags apply */}
                <RiskFlags
                    analysisScores={assessment.analysis_scores}
                    isotretinoinFlag={assessment.isotretinoin_flag ?? false}
                    riskScore={assessment.risk_score ?? 0}
                    delayMs={1100}
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
                        <p className="text-gray-500 dark:text-[#A3938C] text-[11px] font-bold uppercase tracking-[0.15em] mb-2 font-sans">
                            Clinical Trajectory
                        </p>
                        {/* Emotional forecast line — above CheckinTimeline */}
                        <p className="text-[13px] font-semibold mb-4" style={{ color: resultsBarrierColour }}>
                            {resultsEmotionalText}
                        </p>
                        <CheckinTimeline
                            nodes={timelineNodes}
                            delayMs={1400}
                            coldStartNote={coldStartNote}
                            probabilityFooter="Probability data updates as Toneek outcomes are collected."
                        />
                    </section>
                )}

                {/* 8. System Learning Disclosure (1750ms) */}
                <SystemLearningDisclosure delayMs={1750} />

                {/* Real Outcomes — awaiting beta data or live stats */}
                <RealOutcomes
                    performanceData={formulaPerformance ?? null}
                    delayMs={1780}
                />

                {/* 7. CTA (1800ms) */}
                <section id="results-bottom-cta" className="pt-8 text-center animate-slide-up opacity-0" style={{ animationDelay: '1800ms', animationFillMode: 'forwards' }}>
                    <p className="text-gray-900 dark:text-[#F0E6DF] font-bold text-[22px] mb-6 font-sans tracking-tight">Ready to initiate your sequence?</p>
                    <a href={`/subscribe?assessment_id=${assessment.id}`} className="inline-block bg-[#2A0F06] hover:bg-[#3D1A0E] text-white font-medium py-3.5 mx-auto px-10 rounded-lg shadow-xl shadow-toneek-brown/20 transition-all font-sans text-lg w-full sm:w-auto">
                        Start your treatment protocol
                    </a>
                    <p className="text-gray-400 dark:text-[#A3938C] text-xs mt-5 max-w-sm mx-auto font-sans">
                        Custom compounded on payment confirmation. Bank transfer only.
                    </p>
                </section>
            </div>
        </main>

        {/* Sticky CTA — appears after 400px scroll, hides near bottom CTA */}
        <StickyCTA
            formulaCode={assessment.formula_code || ''}
            subscribeHref={`/subscribe?assessment_id=${assessment.id}`}
            bottomCtaId="results-bottom-cta"
        />
        </>
    )
}
