// src/app/subscribe/page.tsx
// Plan selection page — customer arrives here from results page CTA.
// Server component: reads assessment to resolve currency, then passes to client.

import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrency } from '@/lib/currency'
import { redirect } from 'next/navigation'
import SubscribePlans from '@/components/payment/SubscribePlans'

export const metadata = {
    title: 'Choose your plan — Toneek',
    description: 'Select a Toneek subscription plan. Payment by bank transfer only.',
}

export default async function SubscribePage({
    searchParams,
}: {
    searchParams: Promise<{ assessment_id?: string }>
}) {
    const { assessment_id } = await searchParams

    if (!assessment_id) redirect('/assessment')

    // Fetch assessment to get country → currency, formula, and routine expectation
    const { data: assessment, error } = await adminClient
        .from('skin_assessments')
        .select('id, user_id, country_of_residence, formula_code, skin_os_score, routine_expectation')
        .eq('id', assessment_id)
        .single()

    if (error || !assessment) redirect('/assessment')

    const currency = resolveCurrency(assessment.country_of_residence ?? 'Nigeria')
    const routine_tier = assessment.routine_expectation ?? 'just_one'

    // Fetch dynamic plans from the database directly, matching the routine tier
    const { data: plansData, error: plansError } = await adminClient
        .from('subscription_tiers')
        .select('*')
        .eq('routine_tier', routine_tier)
        .order('sort_order', { ascending: true })

    if (plansError || !plansData) {
         console.error('Failed to load subscription tiers')
         // Hard fallback or redirect
    }

    return (
        <main className="min-h-screen bg-[#FCFAF8] dark:bg-[#1A1210] py-12 px-4 sm:px-6 font-sans">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex flex-col items-center text-center mb-8">
                    <img src="/logo.svg" alt="Toneek" className="h-12 w-auto mb-4 dark:hidden" />
                    <img src="/logo-dark.svg" alt="Toneek" className="h-12 w-auto mb-4 hidden dark:block" />
                    <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Choose the plan that works for you</p>
                </div>

                <div className="bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-sm flex justify-between items-center">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Your formula</p>
                        <p className="font-bold text-lg text-gray-900 dark:text-gray-100 font-mono tracking-tight">{assessment.formula_code}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Skin OS Score</p>
                        <p className="font-black text-2xl tracking-tighter text-toneek-amber">{assessment.skin_os_score}</p>
                    </div>
                </div>

                <div className="text-center py-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        You selected: {routine_tier === 'just_one' ? 'Just one product' : routine_tier === 'two_to_three' ? 'Two to three products' : 'Whatever it takes'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {routine_tier === 'just_one' && 'Prices include your bespoke formula only.'}
                        {routine_tier === 'two_to_three' && 'Prices include your formula + cleanser + moisturiser, all personalised to your skin and climate.'}
                        {routine_tier === 'whatever_it_takes' && 'Prices include your full 4-product routine, all personalised to your skin and climate.'}
                    </p>
                </div>

                <SubscribePlans
                    assessmentId={assessment_id}
                    userId={assessment.user_id ?? null}
                    currency={currency}
                    plans={plansData || []}
                    routineTier={routine_tier}
                />

                <p className="text-center text-gray-400 dark:text-gray-500 text-[11px] mt-6 max-w-md mx-auto leading-relaxed font-medium">
                    Payment by bank transfer only. Your formula is made to order and dispatched within 5–7 business days of payment confirmation.
                </p>
            </div>
        </main>
    )
}
