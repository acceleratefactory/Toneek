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
        .select('formula_code')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!subscription) {
        redirect('/subscribe')
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f5f5f5' }}>My Plan</h1>

            {/* Plan summary card */}
            <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                            Current plan
                        </p>
                        <p style={{ fontWeight: 700, fontSize: '1.2rem', color: '#f5f5f5' }}>
                            {PLAN_LABELS[subscription.plan_tier ?? ''] ?? subscription.plan_tier}
                        </p>
                    </div>
                    <span style={{
                        background: `${cfg.colour}18`,
                        color: cfg.colour,
                        border: `1px solid ${cfg.colour}40`,
                        borderRadius: '20px',
                        padding: '0.3rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                    }}>
                        {cfg.label}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {details.map(({ label, value }) => (
                        <div key={label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.6rem 0', borderBottom: '1px solid #1f1f1f',
                        }}>
                            <span style={{ color: '#666', fontSize: '0.85rem' }}>{label}</span>
                            <span style={{ color: '#f5f5f5', fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>
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
