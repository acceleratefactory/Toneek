// src/app/(dashboard)/dashboard/formula/page.tsx
// My Formula view — shows the customer's current and previous formulas.
// Reads from skin_assessments joined with formula_codes.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminClient } from '@/lib/supabase/admin'

import AnimatedScoreRing from '@/components/formula/AnimatedScoreRing'
import MetricGrid from '@/components/formula/MetricGrid'
import FormulaCard from '@/components/formula/FormulaCard'
import IngredientCard from '@/components/formula/IngredientCard'
import ProgressChart from '@/components/formula/ProgressChart'
import CheckinTimeline, { TimelineNode, CheckinState } from '@/components/formula/CheckinTimeline'
import HeldOrderBanner from '@/components/formula/HeldOrderBanner'
import DecisionConfidence from '@/components/formula/DecisionConfidence'
import BehaviouralProtocol from '@/components/formula/BehaviouralProtocol'
import RiskFlags from '@/components/formula/RiskFlags'
import SystemLearningDisclosure from '@/components/formula/SystemLearningDisclosure'
import SystemStatusBar from '@/components/formula/SystemStatusBar'
import EscalationPath from '@/components/formula/EscalationPath'
import AdherencePlaceholder from '@/components/formula/AdherencePlaceholder'
import IntelligenceMilestones from '@/components/formula/IntelligenceMilestones'
import SystemUpdatedBanner from '@/components/formula/SystemUpdatedBanner'
import ClinicalCommitment from '@/components/formula/ClinicalCommitment'
import TodaysBrief from '@/components/dashboard/TodaysBrief'
import AssessmentHistory from '@/components/dashboard/AssessmentHistory'
import StickyCTA from '@/components/formula/StickyCTA'
import { generateProtocol } from '@/lib/protocol/generateProtocol'
import { generateFormulaLogic } from '@/lib/formula/generateFormulaLogic'
import { getDashboardIdentityLine, getFormulaSummaryLine } from '@/lib/formula/identityLine'
import { calculateClinicalDates } from '@/lib/dates/clinicalDates'
import { determineOrderState } from '@/lib/orders/orderState'


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

    // Fetch user profile to check subscription status + last_milestone_shown
    const { data: profile } = await adminClient
        .from('profiles')
        .select('subscription_status, last_milestone_shown')
        .eq('id', session.user.id)
        .single()
    
    // Show the subscribe block only if they haven't subscribed or if they cancelled
    const needsSubscription = !profile?.subscription_status || profile.subscription_status === 'never' || profile.subscription_status === 'cancelled'

    // Fetch subscription start date for ClinicalCommitment tracker
    const { data: subscription } = await adminClient
        .from('subscriptions')
        .select('started_at')
        .eq('user_id', session.user.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()
    const subscriptionStartedAt = subscription?.started_at ?? null

    // Fetch latest order with ALL status fields
    const { data: latestOrder, error: orderError } = await adminClient
        .from('orders')
        .select(`
            id,
            status,
            payment_status,
            payment_confirmed_at,
            received_at,
            courier,
            tracking_number,
            tracking_url,
            payment_reference,
            payment_amount,
            currency,
            plan_tier,
            dispatch_held_reason,
            created_at,
            dispatched_at
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    // Log to console for debugging (remove after fix confirmed)
    console.log('ORDER DEBUG:', {
        id: latestOrder?.id,
        status: latestOrder?.status,
        payment_status: latestOrder?.payment_status,
        payment_confirmed_at: latestOrder?.payment_confirmed_at,
        received_at: latestOrder?.received_at,
    })

    const orderStatus         = latestOrder?.status ?? null
    const dispatchHeldReason  = latestOrder?.dispatch_held_reason ?? null

    // STEP 5: Centralize all clinical dates and order state
    const clinical_dates = calculateClinicalDates(latestOrder?.received_at ?? null)
    const order_state = determineOrderState(latestOrder)
    console.log('ORDER STATE:', order_state)

    // Fetch all assessments for this user, newest first
    const { data: assessments, error: fetchError } = await adminClient
        .from('skin_assessments')
        .select('*, formula_codes!formula_code(*)')
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
    const latest = assessments[0]
    const formula = (latest as any).formula_codes

    // active_modules may be stored as a nested array e.g. [[a, b, c]] — flatten to guarantee a flat list
    const rawActives = latest.active_modules ?? formula?.active_modules ?? []
    const actives: any[] = Array.isArray(rawActives[0]) ? rawActives.flat() : rawActives

    // Generate the behavioural protocol for this formula
    const protocol = generateProtocol(
        latest.formula_code || '',
        latest.formula_tier,
        actives,
        latest.pregnant_or_breastfeeding,
    )

    // Generate the formula logic explanation paragraphs
    const logicParagraphs = generateFormulaLogic({
        climate_zone:    latest.climate_zone,
        skin_type:       latest.skin_type,
        primary_concern: latest.primary_concern,
        formula_tier:    latest.formula_tier,
        city:            latest.city,
    })

    const previous = assessments.slice(1)

    // Fetch skin outcomes for chart and timeline
    const { data: outcomes } = await adminClient
        .from('skin_outcomes')
        .select('check_in_week, improvement_score, recorded_at, new_skin_os_score')
        .eq('user_id', session.user.id)
        .order('recorded_at', { ascending: true })

    // Fetch latest adherence record for AdherencePlaceholder
    const { data: latestOutcome } = await adminClient
        .from('skin_outcomes')
        .select('adherence_score, check_in_week')
        .eq('user_id', session.user.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()
    const adherenceScore  = latestOutcome?.adherence_score ?? undefined
    const adherenceWeek   = latestOutcome?.check_in_week ?? undefined

    // Reformulation eligibility now determined by clinical_dates.review_date
    const isEligible = clinical_dates.has_received && clinical_dates.review_date && new Date() >= clinical_dates.review_date
    const eligibleDateStr = clinical_dates.review_date ? clinical_dates.review_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date confirmed on delivery'

    const currentScore = latest.skin_os_score ?? 50
    const scoreDiff = (outcomes && outcomes.length > 0) ? currentScore - 50 : 0 // Simplified trend logic

    const pathPills = [
        latest.city || 'Location',
        latest.skin_type || 'Variable',
        latest.primary_concern?.replace(/_/g, ' ') || 'Skin health'
    ]

    // Construct ProgressChart Data
    const chartData = (outcomes || []).map(o => ({
        week: o.check_in_week,
        score: o.improvement_score || 5
    }))

    // Construct CheckinTimeline nodes securely based on elapsed time from assessment
    const now = new Date()
    let hasDueCheckin = false
    let dueCheckinWeek = 0

    const getExpectation = (week: number) => {
        const customW2 = formula?.week_2_expectation || formula?.base_formula?.week_2_expectation
        const customW8 = formula?.week_8_expectation || formula?.base_formula?.week_8_expectation

        if (week === 2) return customW2 || 'Skin inflammation calming, barrier beginning to stabilise. No visible pigment change at this stage — this is normal.'

        if (week === 4) {
            const explicit = formula?.week_4_expectation || formula?.base_formula?.week_4_expectation
            if (explicit) return explicit
            const c = latest.primary_concern || ''
            if (c === 'PIH' || c === 'tone')  return 'Tone beginning to even. First visible lightening of surface pigmentation.'
            if (c === 'acne')                 return 'Breakout frequency reducing. PIH marks static or beginning to fade.'
            if (c === 'dryness')              return 'Barrier measurably more resilient. Tightness significantly reduced.'
            if (c === 'sensitivity')          return 'Reactivity reducing. Barrier calming — skin becoming more tolerant of daily environmental exposure.'
            if (c === 'oiliness')             return 'Sebum regulation beginning. Midday shine reducing — pore appearance improving.'
            return 'Visible improvement beginning — primary concern starting to respond to treatment.'
        }

        return customW8 || 'Measurable change in primary concern. Skin OS Score recalculated from your Week 8 check-in.'
    }

    // Cold start detection (200+ outcome records for this formula = learning mode)
    const { count: formulaOutcomeCount } = await adminClient
        .from('skin_outcomes')
        .select('id', { count: 'exact', head: true })
        .eq('formula_code', latest.formula_code)

    const isColdStart = (formulaOutcomeCount ?? 0) < 200
    const coldStartNote = isColdStart
        ? 'Based on clinical evidence for your active ingredients. Probability data updates as outcomes are collected.'
        : undefined

    // Clinical evidence notes per week (from toneek_final_five_upgrades.md)
    const w2EvidenceNote = 'Most users on this formula feel noticeably calmer skin by Day 10. This timeline is consistent with clinical evidence for FST IV–VI skin.'
    const c = latest.primary_concern || ''
    let w4EvidenceNote: string
    if (c === 'PIH' || c === 'tone') {
        w4EvidenceNote = 'Visible tone improvement begins here for most users — 65–72% of FST IV–VI patients on targeted brightening actives see measurable change at Week 4.'
    } else if (c === 'acne') {
        w4EvidenceNote = 'Clinical evidence: targeted anti-acne combinations show 60–75% reduction in active lesions by Week 4 in melanin-rich skin studies.'
    } else if (c === 'dryness' || c === 'sensitivity') {
        w4EvidenceNote = 'Barrier repair measurable at 4 weeks for most users on this protocol. Clinical confirmation for Centella at 5% in compromised FST IV–VI skin.'
    } else {
        w4EvidenceNote = 'Clinical evidence: targeted active combinations for your concern show measurable improvement in 60–70% of patients at Week 4.'
    }
    const w8EvidenceNote = 'Your primary clinical milestone. 70–78% of FST IV–VI patients on targeted active combinations achieve measurable improvement by Week 8.'

    const EVIDENCE_NOTES: Record<number, string> = {
        2: w2EvidenceNote,
        4: w4EvidenceNote,
        8: w8EvidenceNote,
    }

    const timelineNodes: TimelineNode[] = TIMELINE.map((item, index) => {
        const outcome = outcomes?.find(o => o.check_in_week === item.week)
        const desc = getExpectation(item.week)
        const evidenceNote = EVIDENCE_NOTES[item.week]
        
        if (outcome) {
            return { week: item.week, state: 'COMPLETED', score: outcome.improvement_score, description: desc, evidenceNote }
        }
        
        if (!clinical_dates.has_received) {
            return { week: item.week, state: 'LOCKED', dateText: 'Date confirmed on delivery', description: desc, evidenceNote }
        }

        const checkin_date = item.week === 2 ? clinical_dates.week2_date : item.week === 4 ? clinical_dates.week4_date : clinical_dates.week8_date
        
        // Ensure strictly sequential completion
        const previousWeek = index > 0 ? TIMELINE[index - 1].week : null
        const previousOutcome = previousWeek ? outcomes?.find(o => o.check_in_week === previousWeek) : null
        const isLocked = index > 0 && !previousOutcome

        if (isLocked || !checkin_date) {
            return { week: item.week, state: 'LOCKED', dateText: 'Available after previous check-in', description: desc, evidenceNote }
        }

        if (now >= checkin_date) {
            hasDueCheckin = true
            if (dueCheckinWeek === 0) dueCheckinWeek = item.week
            return { week: item.week, state: 'DUE_NOW', dateText: 'Due now', description: desc, evidenceNote }
        }
        
        return { 
            week: item.week, 
            state: 'PENDING', 
            dateText: `Available ${checkin_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
            description: desc,
            evidenceNote,
        }
    })

    let photoUrl = latest.intake_photo_url
    if (photoUrl && !photoUrl.startsWith('http')) {
        const cleanPath = photoUrl.replace(/^checkin-photos\//, '').replace(/^\//, '')
        const { data } = adminClient.storage.from('checkin-photos').getPublicUrl(cleanPath)
        photoUrl = data?.publicUrl || photoUrl // fallback to raw string if generation completely fails
    }

    // Query prediction_log count for this profile_segment (used by DecisionConfidence)
    const profileSegment = latest.profile_segment || ''
    const { count: profileCount } = await adminClient
        .from('prediction_log')
        .select('id', { count: 'exact', head: true })
        .eq('profile_segment', profileSegment)

    // ─── Milestone unlock logic ─────────────────────────────────────────────
    const count = profileCount ?? 0
    const currentMilestone =
        count >= 5000 ? 5000 :
        count >= 1000 ? 1000 :
        count >= 200  ? 200  :
        count >= 50   ? 50   : 0

    const lastMilestoneShown = profile?.last_milestone_shown ?? 0
    let newlyUnlockedMilestone: number | undefined

    if (currentMilestone > lastMilestoneShown) {
        newlyUnlockedMilestone = currentMilestone
        // Update server-side — fires once per milestone per user
        await adminClient
            .from('profiles')
            .update({ last_milestone_shown: currentMilestone })
            .eq('id', session.user.id)
    }

    // Compute comparative percentiles from prediction_log for this profile_segment
    let comparativeData: Record<string, number> | null = null
    if ((profileCount ?? 0) >= 50) {
        const { data: peerScores } = await adminClient
            .from('prediction_log')
            .select('analysis_scores')
            .eq('profile_segment', profileSegment)
            .not('analysis_scores', 'is', null)
            .limit(500)

        if (peerScores && peerScores.length >= 50) {
            const myScores = latest.analysis_scores as Record<string, number> | null
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

    return (
        <>
        <div className="flex flex-col font-sans mb-12">
            
            {/* ── Top Header Banner (Zoho Style) ── */}
            <div className="bg-[#FAF8F5] dark:bg-[#261B18] pt-6 sm:pt-8 px-6 sm:px-10 rounded-b-xl shadow-[0_2px_10px_rgba(42,15,6,0.04)] border-b border-[#E8E0DA] dark:border-[#3A2820] -mt-4 sm:-mt-8 mx-[-1rem] sm:mx-[-2rem] mb-8 relative pb-6 sm:pb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#2A0F06] font-sans flex items-center gap-3">
                            My Formula
                            <span className="bg-[#2A0F06] text-white font-mono text-[13px] sm:text-[14px] px-2.5 py-1.5 rounded-md tracking-tight">
                                {latest.formula_code}
                            </span>
                        </h1>
                        <p className="text-[#8C7B72] dark:text-gray-400 text-[13px] mt-2 font-medium tracking-wide">
                            Last updated: {new Date(latest.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-[12px] text-[#8C7B72] dark:text-[#7A6A62] font-normal mt-1" style={{ fontFamily: 'Jost, sans-serif' }}>
                            {getDashboardIdentityLine(latest.climate_zone, latest.skin_type)}
                        </p>
                    </div>
                    {photoUrl && (
                        <div className="flex-shrink-0 self-start sm:self-auto w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-2 sm:mb-0">
                            <img src={photoUrl} alt="Assessment Profile" className="w-full h-full rounded-full border-[5px] border-white dark:border-[#302420] shadow-[0_4px_15px_rgba(42,15,6,0.06)] object-cover bg-[#E8E0DA]" />
                        </div>
                    )}
                </div>
            </div>

            {/* ── SYSTEM STATUS BAR ── */}
            <SystemStatusBar
                formulaCode={latest.formula_code}
                clinical_dates={clinical_dates}
                order_state={order_state}
                outcomes={outcomes || []}
                isColdStart={isColdStart}
            />

            {/* ── SYSTEM UPDATED BANNER (client-side, sessionStorage) ── */}
            <SystemUpdatedBanner />

            {hasDueCheckin && (
                <HeldOrderBanner checkinWeekRequired={dueCheckinWeek} />
            )}

            {/* ── PHASE 2: HERO SECTION (2 CARDS 50/50) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                
                {/* 1. Left: Score Ring Profile Card */}
                <div className="bg-white dark:bg-[#1A1210] rounded-xl shadow-[0_2px_10px_rgba(42,15,6,0.04)] border border-[#E8E0DA] dark:border-[#3A2820] p-6 lg:p-8 flex flex-col justify-between items-center text-center h-full">
                    <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest self-start w-full text-left mb-6">Aggregate Skin OS</h5>
                    <AnimatedScoreRing score={currentScore} size={180} showLabel={false} delay={100} />
                    
                    <div className="mt-8 flex flex-col items-center gap-2 w-full">
                        {scoreDiff > 0 ? (
                            <p className="text-toneek-forest font-semibold text-[15px]">↑ Skin health improving</p>
                        ) : scoreDiff < 0 ? (
                            <p className="text-[#C13B2E] font-semibold text-[15px]">↓ Consistency required</p>
                        ) : (
                            <p className="text-[#8C7B72] font-semibold text-[15px]">→ Assessing baseline</p>
                        )}

                        <p className="text-[12px] italic text-[#8C7B72] font-sans text-center mt-1">
                            {currentScore >= 80 ? 'Excellent — Strong skin foundation.' : currentScore >= 70 ? 'Strong — Clear improvement trajectory.' : currentScore >= 60 ? 'Good — Formula actively targeting concerns.' : currentScore >= 50 ? 'Recovering — Measurable gains expected by Week 8.' : currentScore >= 40 ? 'Active treatment needed — Complex presentation.' : 'Intensive protocol — Restoration phase initiated.'}
                        </p>

                        <div className="w-full mt-4">
                            <DecisionConfidence
                                confidenceScore={latest.confidence_score ?? 0.6}
                                profileCount={profileCount ?? 0}
                                outcomeCount={profileCount ?? 0}
                                variant="dashboard"
                                delayMs={300}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Right: Protocol (Dark Box) + Milestones */}
                <div className="flex flex-col gap-6 h-full relative">
                    <TodaysBrief
                        order_state={order_state}
                        order={latestOrder || {}}
                        clinical_dates={clinical_dates}
                        assessment={latest}
                        outcomes={outcomes || []}
                    />
                    
                    <div className="mt-2">
                        <IntelligenceMilestones
                            outcomeCount={profileCount ?? 0}
                            newlyUnlockedMilestone={newlyUnlockedMilestone}
                            delayMs={350}
                        />
                    </div>

                    {/* Sentinel — sticky CTA appears when this leaves the viewport */}
                    <div id="sticky-cta-trigger" className="absolute bottom-0 w-full" aria-hidden="true" />
                </div>
            </div>

            {/* ── Admin-Style Block Layout ── */}
            <div className="flex flex-col gap-8">
                
                {/* Formula Architecture & Review Card (50/50 Layout) */}
                <div className="w-full">
                    <FormulaCard 
                        formulaCode={latest.formula_code}
                        formulaName={formula?.profile_description || 'Active Protocol'}
                        formulaRationale={latest.formula_rationale}
                        climateZone={CLIMATE_DESCRIPTIONS[latest.climate_zone] || latest.climate_zone || 'Your Location'}
                        pathPills={pathPills}
                        logicParagraphs={logicParagraphs}
                        summaryLine={getFormulaSummaryLine(latest.formula_tier, latest.climate_zone, latest.primary_concern)}
                        delayMs={300}
                    >
                        {/* Formula Review Schedule Card (Matches right bottom card in screenshot) */}
                        <div className={`bg-white dark:bg-[#1A1210] border shadow-[0_2px_10px_rgba(42,15,6,0.04)] rounded-xl p-6 lg:p-8 flex flex-col gap-6 w-full ${isEligible ? 'border-toneek-amber/20 bg-[#FCF9F5]' : 'border-gray-100 dark:border-[#3A2820]'}`}>
                            <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest font-sans">
                                Formula Review Schedule
                            </h5>
                            
                            {isEligible ? (
                                <div className="flex justify-between items-center bg-toneek-amber/10 p-4 rounded-lg border border-toneek-amber/20">
                                    <p className="text-toneek-forest font-bold text-[14px]">Formula review available now ✓</p>
                                    <a href="/assessment" className="inline-block bg-[#2A0F06] text-white px-6 py-2.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
                                        Request review
                                    </a>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="text-2xl sm:text-3xl font-bold text-toneek-brown dark:text-[#F0E6DF] whitespace-nowrap">
                                            {clinical_dates.has_received ? eligibleDateStr : 'TBC'}
                                        </div>
                                        <p className="text-gray-600 dark:text-[#A3938C] text-[12px] font-medium leading-relaxed max-w-[280px] sm:text-right">
                                            {clinical_dates.has_received 
                                              ? <>Your formula can be reviewed and seamlessly updated from <span className="text-toneek-brown dark:text-[#F0E6DF] font-bold">{eligibleDateStr}</span> — after 6 weeks of active use.</>
                                              : 'Formula review date will be set when you log delivery.'}
                                        </p>
                                    </div>

                                    {/* 6-Week Progress Bar */}
                                    <div className="w-full mt-2">
                                        <div className="flex gap-1 h-3 w-full">
                                            {[1, 2, 3, 4, 5, 6].map((w) => {
                                                const currentWeek = clinical_dates.has_received ? Math.min(Math.floor((clinical_dates.days_since_receipt ?? 0) / 7) + 1, 6) : 0;
                                                
                                                return (
                                                    <div 
                                                        key={w} 
                                                        className={`flex-1 rounded-sm relative ${w <= currentWeek ? 'bg-gradient-to-r from-[#D7A27D] to-[#C88A5E]' : 'bg-[#EFEAE4] dark:bg-[#3A2820]'}`}
                                                    >
                                                        {w === currentWeek && (
                                                            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-[#C88A5E] rounded-full shadow-sm" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-4 items-center mt-3">
                                            {(() => {
                                                const currentWeek = clinical_dates.has_received ? Math.min(Math.floor((clinical_dates.days_since_receipt ?? 0) / 7) + 1, 6) : 0;
                                                return (
                                                    <p className="text-[11px] font-bold text-toneek-brown uppercase tracking-widest">
                                                        Week {currentWeek || 1}
                                                    </p>
                                                );
                                            })()}
                                            <p className="text-[12px] text-gray-500 font-medium">Active Use</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </FormulaCard>
                </div>

                {/* ── METRIC GRID ROW ── */}
                <div className="w-full">
                    <MetricGrid assessment={latest} delayMs={500} comparativeData={comparativeData} />
                </div>

                {/* ── ACTIVE CONSTITUENTS BLOCK (MOVED HERE) ── */}
                {actives.length > 0 && (
                    <div className="animate-slide-up opacity-0 mt-4 mb-4" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
                        <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 pl-1">Active System Constituents</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {actives.map((active: any, i: number) => {
                                const maxLimits: Record<string, number> = {
                                    'Niacinamide': 10, 'Azelaic Acid': 15, 'Salicylic Acid': 2,
                                    'Tranexamic Acid': 5, 'Bakuchiol': 2, 'Kojic Acid': 2,
                                    'Centella Asiatica': 5, 'Peptide Blend': 5
                                }
                                return (
                                    <IngredientCard 
                                        key={i}
                                        name={active.name}
                                        role={active.role || 'TARGETED ACTIVE'}
                                        concentration={parseFloat(active.concentration) || 0}
                                        maxSafeLimit={maxLimits[active.name] || 10}
                                        rationale={active.rationale}
                                        delayMs={550 + (Math.floor(i) * 100)}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── BEHAVIOURAL PROTOCOL ── */}
                <BehaviouralProtocol protocol={protocol} delayMs={600} />

                {/* ── RISK FLAGS ── conditional, only shown if flags apply */}
                <RiskFlags
                    analysisScores={latest.analysis_scores}
                    isotretinoinFlag={latest.isotretinoin_flag ?? false}
                    riskScore={latest.risk_score ?? 0}
                    delayMs={700}
                />
                
                {/* ── PROGRESS & TIMELINE ROW ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Progress Chart Card */}
                    <div className="bg-white dark:bg-[#1A1210] rounded-xl shadow-[0_2px_10px_rgba(42,15,6,0.04)] border border-[#E8E0DA] dark:border-[#3A2820] p-8 lg:p-10 animate-slide-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                        <div className="flex flex-col mb-6">
                           <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Progress Over Time</h5>
                           <p className="text-sm text-gray-400">Tracked via your clinical check-ins</p>
                        </div>
                        <div className="mt-4">
                            <ProgressChart data={chartData} currentScore={currentScore} />
                            {outcomes && outcomes.length > 1 && (
                                <p className="text-toneek-forest text-[13px] font-semibold mt-4 flex items-center justify-center gap-1 w-full text-center">
                                    ↑ Your skin is responding positively to the formula
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-white dark:bg-[#1A1210] rounded-xl shadow-[0_2px_10px_rgba(42,15,6,0.04)] border border-[#E8E0DA] dark:border-[#3A2820] p-8 lg:p-10 animate-slide-up opacity-0" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
                        <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-8">Clinical Check-in Schedule</h5>
                        <CheckinTimeline
                            nodes={timelineNodes}
                            delayMs={800}
                            coldStartNote={coldStartNote}
                            probabilityFooter="Probability data updates as Toneek outcomes are collected."
                        />
                    </div>
                </div>

                {/* ── CLINICAL COMMITMENT & ADHERENCE (50/50 LAYOUT) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ClinicalCommitment
                        clinical_dates={clinical_dates}
                        outcomes={outcomes}
                        delayMs={840}
                    />

                    <AdherencePlaceholder
                        clinical_dates={clinical_dates}
                        adherenceScore={adherenceScore}
                        checkinWeek={adherenceWeek}
                        delayMs={850}
                    />
                </div>

                {/* ── ESCALATION PATH ── */}
                <EscalationPath delayMs={850} />

                {/* Active constituents were moved up */}

                {/* ── SYSTEM LEARNING DISCLOSURE ── */}
                <SystemLearningDisclosure delayMs={900} />

                {/* ── ASSESSMENT HISTORY ── */}
                <AssessmentHistory
                    assessments={assessments.map(a => ({
                        id: a.id,
                        created_at: a.created_at,
                        formula_code: a.formula_code ?? null,
                        skin_os_score: a.skin_os_score ?? null,
                    }))}
                />

                {/* ── SUBSCRIPTION BANNER ── */}
                {needsSubscription && (
                    <div className="bg-[#FEF3E2] border border-[#D4700A] p-8 rounded-xl mt-4 text-center shadow-[0_2px_10px_rgba(42,15,6,0.04)]">
                        <p className="font-bold text-[#2A0F06] text-xl mb-4">Formula synthesized. Proceed to checkout.</p>
                        <a href={`/subscribe?assessment_id=${latest.id}`} className="inline-block px-10 py-3.5 bg-[#382218] hover:bg-[#2A0F06] text-white rounded-lg font-bold transition-all shadow-md">
                            Subscribe to commence protocol
                        </a>
                        <p className="text-[#8C7B72] text-[11px] mt-4 uppercase tracking-wider font-semibold">
                            Secure direct fulfillment · Premium formulation
                        </p>
                    </div>
                )}

            </div>
        </div>

        {/* Sticky CTA — visible to non-subscribers browsing the formula page */}
        {needsSubscription && (
            <StickyCTA
                formulaCode={latest.formula_code || ''}
                subscribeHref={`/subscribe?assessment_id=${latest.id}`}
            />
        )}
        </>
    )
}
