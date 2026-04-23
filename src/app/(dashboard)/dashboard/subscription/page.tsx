// src/app/(dashboard)/dashboard/subscription/page.tsx
// Subscription management — shows plan, status, actions (pause/cancel/upgrade).

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SubscriptionActions from '@/components/dashboard/SubscriptionActions'

export const metadata = { title: 'My Plan — Toneek' }

const PLAN_LABELS: Record<string, string> = {
    essentials:    'Essentials',
    full_protocol: 'Full Protocol',
    restoration:   'Restoration Protocol',
}

const STATUS_CONFIG: Record<string, { label: string; colour: string }> = {
    active:      { label: 'Active',      colour: '#4caf82' },
    paused:      { label: 'Paused',      colour: '#e09a3a' },
    cancelling:  { label: 'Cancelling',  colour: '#e05555' },
    cancelled:   { label: 'Cancelled',   colour: '#e05555' },
    pending:     { label: 'Pending',     colour: '#888'    },
}

export default async function SubscriptionPage() {
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

    // Fetch subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, plan_tier, status, started_at, next_billing_date, pause_until, cancelled_at, cancel_reason, currency, monthly_amount')
        .eq('user_id', session.user.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    // Fetch latest formula from assessments
    const { data: assessment } = await supabase
        .from('skin_assessments')
        .select('id, formula_code')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!subscription) {
        if (assessment?.id) {
            redirect(`/subscribe?assessment_id=${assessment.id}`)
        } else {
            redirect('/assessment')
        }
    }

    const startedAt   = new Date(subscription.started_at)
    const weeksActive = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24 * 7))
    const cfg         = STATUS_CONFIG[subscription.status] ?? { label: subscription.status, colour: '#888' }

    const SYMBOLS: Record<string, string> = { NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵', CAD: 'CA$' }
    const symbol = SYMBOLS[subscription.currency ?? 'NGN'] ?? '₦'

    const details = [
        { label: 'Plan',           value: PLAN_LABELS[subscription.plan_tier ?? ''] ?? subscription.plan_tier },
        { label: 'Formula',        value: assessment?.formula_code ?? '—' },
        { label: 'Weeks active',   value: `${weeksActive} week${weeksActive !== 1 ? 's' : ''}` },
        { label: 'Monthly amount', value: subscription.monthly_amount ? `${symbol}${subscription.monthly_amount.toLocaleString()}` : '—' },
        {
            label: 'Next billing',
            value: subscription.next_billing_date
                ? new Date(subscription.next_billing_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—',
        },
    ]

    if (subscription.status === 'paused' && subscription.pause_until) {
        details.push({
            label: 'Paused until',
            value: new Date(subscription.pause_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        })
    }

    if (subscription.status === 'cancelling' && subscription.next_billing_date) {
        details.push({
            label: 'Ends on',
            value: new Date(subscription.next_billing_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        })
    }

    return (
        <div className="flex flex-col gap-6 font-sans">
            {/* ── Top Header Banner (Zoho Style) ── */}
            <div className="bg-white dark:bg-[#261B18] pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 dark:border-[#3A2820] -mt-8 sm:-mt-8 mx-[-1rem] sm:mx-[-2rem] mb-2 relative pb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Plan</h1>
            </div>

            {/* Plan summary card */}
            <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">
                            Current plan
                        </p>
                        <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                            {PLAN_LABELS[subscription.plan_tier ?? ''] ?? subscription.plan_tier}
                        </p>
                    </div>
                    <span style={{
                        background: `${cfg.colour}18`,
                        color: cfg.colour,
                        border: `1px solid ${cfg.colour}40`,
                    }} className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-opacity-20">
                        {cfg.label}
                    </span>
                </div>

                <div className="flex flex-col gap-0 border-t border-gray-100 dark:border-gray-800">
                    {details.map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-[#1f1f1f] last:border-0">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</span>
                            <span className="text-gray-800 dark:text-gray-200 text-sm font-bold">{value}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Actions */}
            <SubscriptionActions
                subscriptionId={subscription.id}
                currentPlan={subscription.plan_tier ?? 'essentials'}
                status={subscription.status}
            />
        </div>
    )
}
