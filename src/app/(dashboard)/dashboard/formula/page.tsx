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
    const latest = assessments[0]
    const formula = (latest as any).formula_codes
    const actives: any[] = latest.active_modules ?? formula?.active_modules ?? []
    const previous = assessments.slice(1)

    // Fetch skin outcomes for chart and timeline
    const { data: outcomes } = await adminClient
        .from('skin_outcomes')
        .select('check_in_week, improvement_score, recorded_at, new_skin_os_score')
        .eq('user_id', session.user.id)
        .order('recorded_at', { ascending: true })

    // Reformulation eligibility
    const assessedAt = new Date(latest.created_at)
    const eligibleAt = new Date(assessedAt.getTime() + 42 * 24 * 60 * 60 * 1000)
    const isEligible = new Date() >= eligibleAt
    const eligibleDateStr = eligibleAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

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
        const customW4 = formula?.week_4_expectation || formula?.base_formula?.week_4_expectation
        const customW8 = formula?.week_8_expectation || formula?.base_formula?.week_8_expectation

        if (week === 2) return customW2 || 'Skin inflammation calming, barrier beginning to stabilise.'
        if (week === 4) return customW4 || 'Visible improvement beginning — uneven tone starting to lift.'
        return customW8 || 'Measurable change in primary concern. Skin OS Score recalculated.'
    }

    const timelineNodes: TimelineNode[] = TIMELINE.map((item, index) => {
        const expectedDate = new Date(assessedAt.getTime() + item.week * 7 * 24 * 60 * 60 * 1000)
        const outcome = outcomes?.find(o => o.check_in_week === item.week)
        const desc = getExpectation(item.week)
        
        if (outcome) {
            return { week: item.week, state: 'COMPLETED', score: outcome.improvement_score, description: desc }
        }
        
        // Ensure strictly sequential completion
        const previousWeek = index > 0 ? TIMELINE[index - 1].week : null
        const previousOutcome = previousWeek ? outcomes?.find(o => o.check_in_week === previousWeek) : null
        
        if (now >= expectedDate) {
             if (index === 0 || previousOutcome) {
                 hasDueCheckin = true
                 if (dueCheckinWeek === 0) dueCheckinWeek = item.week
                 return { week: item.week, state: 'DUE_NOW', dateText: 'Due now', description: desc }
             }
        }
        
        const isLocked = index > 0 && !previousOutcome
        return { 
            week: item.week, 
            state: isLocked ? 'LOCKED' : 'PENDING', 
            dateText: `Available ${expectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
            description: desc 
        }
    })

    let photoUrl = latest.intake_photo_url
    if (photoUrl && !photoUrl.startsWith('http')) {
        const cleanPath = photoUrl.replace(/^checkin-photos\//, '').replace(/^\//, '')
        const { data } = adminClient.storage.from('checkin-photos').getPublicUrl(cleanPath)
        photoUrl = data?.publicUrl || photoUrl // fallback to raw string if generation completely fails
    }

    return (
        <div className="flex flex-col font-sans mb-12">
            
            {/* ── Top Header Banner (Zoho Style) ── */}
            <div className="bg-[#FAF8F5] dark:bg-[#261B18] pt-6 px-10 rounded-b-xl shadow-[0_2px_10px_rgba(42,15,6,0.04)] border-b border-[#E8E0DA] dark:border-[#3A2820] -mt-4 sm:-mt-8 mx-[-1rem] sm:mx-[-2rem] mb-8 relative pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2A0F06] font-sans flex items-center gap-3">
                            My Formula
                            <span className="bg-[#2A0F06] text-white font-mono text-[13px] px-2.5 py-1.5 rounded-md tracking-tight">
                                {latest.formula_code}
                            </span>
                        </h1>
                        <p className="text-[#8C7B72] dark:text-gray-400 text-[13px] mt-1.5 font-medium tracking-wide">
                            Last updated: {new Date(latest.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    {photoUrl && (
                        <div className="hidden sm:block">
                            <img src={photoUrl} alt="Profile" className="w-14 h-14 rounded-full border-4 border-white shadow-sm object-cover" />
                        </div>
                    )}
                </div>
            </div>

            {hasDueCheckin && (
                <HeldOrderBanner checkinWeekRequired={dueCheckinWeek} />
            )}

            {/* ── Admin-Style Block Layout ── */}
            <div className="flex flex-col gap-8">
                
                {/* ── TOP METRICS ROW ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Main Score Ring Profile Card */}
                    <div className="bg-white dark:bg-[#1A1210] rounded-xl shadow-[0_2px_10px_rgba(42,15,6,0.04)] border border-[#E8E0DA] dark:border-[#3A2820] p-8 flex flex-col justify-between items-center text-center">
                        <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest self-start w-full text-left mb-6">Aggregate Skin OS</h5>
                        <AnimatedScoreRing score={currentScore} size={180} showLabel={false} delay={100} />
                        
                        <div className="mt-8 flex flex-col items-center gap-2">
                           {scoreDiff > 0 ? (
                                <p className="text-toneek-forest font-semibold text-[15px]">↑ Skin health improving</p>
                           ) : scoreDiff < 0 ? (
                                <p className="text-[#C13B2E] font-semibold text-[15px]">↓ Consistency required</p>
                           ) : (
                                <p className="text-[#8C7B72] font-semibold text-[15px]">→ Assessing baseline</p>
                           )}
                        </div>
                    </div>

                    {/* Formula Architecture & Review Card */}
                    <div className="flex flex-col gap-6">
                        <FormulaCard 
                            formulaCode={latest.formula_code}
                            formulaName={formula?.profile_description || 'Active Protocol'}
                            formulaRationale={latest.formula_rationale}
                            climateZone={CLIMATE_DESCRIPTIONS[latest.climate_zone] || latest.climate_zone || 'Your Location'}
                            pathPills={pathPills}
                            delayMs={300}
                        />

                        {/* Formula Review Sub-Card */}
                        <div className={`rounded-xl p-6 border shadow-[0_2px_10px_rgba(42,15,6,0.04)] ${isEligible ? 'bg-[#FCF9F5] border-[#E8E0DA]' : 'bg-white dark:bg-[#1A1210] border-[#E8E0DA] dark:border-[#3A2820]'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Formula Review Schedule</h5>
                            </div>
                            {isEligible ? (
                                <div className="flex justify-between items-center bg-toneek-amber/10 p-3 rounded-md">
                                    <p className="text-toneek-forest font-bold text-[14px]">Formula review available now ✓</p>
                                    <a href="/assessment" className="inline-block bg-[#2A0F06] text-white px-5 py-2 rounded-md text-[13px] font-bold transition-colors">
                                        Request review
                                    </a>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-[14px] font-medium mt-1">
                                    Your formula can be reviewed and seamlessly updated from <span className="text-[#2A0F06] font-bold">{eligibleDateStr}</span> — after 6 weeks of active use.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── METRIC GRID ROW ── */}
                <div className="w-full">
                    <MetricGrid assessment={latest} delayMs={500} />
                </div>
                
                {/* ── PROGRESS & TIMELINE ROW ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Progress Chart Card */}
                    <div className="bg-white dark:bg-[#1A1210] rounded-xl shadow-[0_2px_10px_rgba(42,15,6,0.04)] border border-[#E8E0DA] dark:border-[#3A2820] p-8 animate-slide-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
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
                    <div className="bg-white dark:bg-[#1A1210] rounded-xl shadow-[0_2px_10px_rgba(42,15,6,0.04)] border border-[#E8E0DA] dark:border-[#3A2820] p-8 animate-slide-up opacity-0" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
                        <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6">Clinical Check-in Schedule</h5>
                        <CheckinTimeline nodes={timelineNodes} delayMs={800} />
                    </div>
                </div>

                {/* ── ACTIVE CONSTITUENTS BLOCK ── */}
                {actives.length > 0 && (
                    <div className="animate-slide-up opacity-0 mt-2" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
                        <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 pl-1">Active System Constituents</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        delayMs={600 + (Math.floor(i) * 100)}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )}

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
    )
}
