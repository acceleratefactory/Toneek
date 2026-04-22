// src/app/(dashboard)/dashboard/orders/page.tsx
// My Orders view — shows all orders with status badges.
// Most important UI: amber held-order banner when check-in is blocking dispatch.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata = { title: 'My Orders — Toneek' }

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; colour: string; bg: string }> = {
    pending_payment:      { label: 'Awaiting payment',   colour: '#888',    bg: 'rgba(136,136,136,0.1)' },
    pending_verification: { label: 'Payment review',     colour: '#e09a3a', bg: 'rgba(224,154,58,0.1)'  },
    confirmed:            { label: 'Payment confirmed',  colour: '#4caf82', bg: 'rgba(76,175,130,0.1)'  },
    pending_production:   { label: 'Queued',             colour: '#d4a574', bg: 'rgba(212,165,116,0.1)' },
    in_production:        { label: 'Being formulated',   colour: '#d4a574', bg: 'rgba(212,165,116,0.1)' },
    pending_dispatch:     { label: 'Ready to dispatch',  colour: '#e09a3a', bg: 'rgba(224,154,58,0.1)'  },
    dispatched:           { label: 'Dispatched',         colour: '#4caf82', bg: 'rgba(76,175,130,0.1)'  },
    delivered:            { label: 'Delivered',          colour: '#4caf82', bg: 'rgba(76,175,130,0.1)'  },
    cancelled:            { label: 'Cancelled',          colour: '#e05555', bg: 'rgba(224,85,85,0.1)'   },
}

const HELD_MESSAGES: Record<string, { week: number; text: string }> = {
    week4_checkin_required: { week: 4, text: 'Your next order is ready but needs your Week 4 check-in first.' },
    week8_checkin_required: { week: 8, text: 'Your next order is ready but needs your Week 8 check-in first.' },
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
    })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrdersPage() {
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

    const { data: orders } = await supabase
        .from('orders')
        .select('id, payment_reference, status, payment_status, formula_code, plan_tier, payment_amount, currency, created_at, dispatched_at, delivered_at, tracking_number, courier, dispatch_held_reason')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

    // Find any held order
    const heldOrder = orders?.find(o => o.dispatch_held_reason)

    const SYMBOLS: Record<string, string> = { NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵', CAD: 'CA$' }

    return (
        <div className="flex flex-col gap-6 font-sans">
            {/* ── Top Header Banner (Zoho Style) ── */}
            <div className="bg-white dark:bg-[#261B18] pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 dark:border-[#3A2820] -mt-8 sm:-mt-8 mx-[-1rem] sm:mx-[-2rem] mb-2 relative pb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Orders</h1>
            </div>

            {/* ── Held order banner — most important UI ── */}
            {heldOrder && HELD_MESSAGES[heldOrder.dispatch_held_reason!] && (() => {
                const { week, text } = HELD_MESSAGES[heldOrder.dispatch_held_reason!]
                return (
                    <div
                        role="alert"
                        className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-900/50 rounded-xl p-5 flex justify-between items-center gap-4 flex-wrap"
                    >
                        <div>
                            <p className="text-orange-600 dark:text-orange-400 font-bold text-sm mb-1">
                                ⏸ Order on hold
                            </p>
                            <p className="text-orange-800 dark:text-orange-300 text-sm leading-relaxed">
                                {text} Complete it now so we can dispatch your formula.
                            </p>
                        </div>
                        <a
                            id="held-order-checkin-cta"
                            className="inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm whitespace-nowrap transition-colors"
                        >
                            Complete Week {week} check-in →
                        </a>
                    </div>
                )
            })()}

            {/* ── Orders list ── */}
            {!orders || orders.length === 0 ? (
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-10 text-center shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">No orders yet.</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        Your first order is created once your payment is confirmed.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {orders.map(order => {
                        const cfg    = STATUS_CONFIG[order.status] ?? { label: order.status, colour: '#888', bg: 'rgba(136,136,136,0.1)' }
                        const isHeld = !!order.dispatch_held_reason

                        return (
                            <div
                                key={order.id}
                                id={`order-${order.id}`}
                                className={`rounded-xl p-6 shadow-sm border ${isHeld ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-500/30' : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#222]'}`}
                            >
                                {/* Top row — ref + status badge */}
                                <div className="flex justify-between items-start gap-3 mb-4">
                                    <div>
                                        <p className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm tracking-wider">
                                            {order.payment_reference ?? order.id.slice(0, 8).toUpperCase()}
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                                            {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                    <span style={{
                                        background: cfg.bg,
                                        color: cfg.colour,
                                        border: `1px solid ${cfg.colour}30`,
                                    }} className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-opacity-20">
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Detail rows */}
                                <div className="flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                                    {order.formula_code && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs">Formula</span>
                                            <span className="font-bold text-toneek-amber text-xs">{order.formula_code}</span>
                                        </div>
                                    )}
                                    {order.plan_tier && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs">Plan</span>
                                            <span className="text-gray-700 dark:text-gray-300 text-xs capitalize">
                                                {order.plan_tier.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    )}
                                    {order.payment_amount && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs">Amount</span>
                                            <span className="text-gray-700 dark:text-gray-300 text-xs">
                                                {SYMBOLS[order.currency] ?? ''}{order.payment_amount?.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {order.dispatched_at && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs">Dispatched</span>
                                            <span className="text-green-600 dark:text-green-400 font-medium text-xs">{formatDate(order.dispatched_at)}</span>
                                        </div>
                                    )}
                                    {order.tracking_number && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs">Tracking</span>
                                            <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">
                                                {order.courier && <span className="mr-2 opacity-80">{order.courier}</span>}
                                                {order.tracking_number}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Held inline note */}
                                {isHeld && (
                                    <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 rounded-lg p-3 text-xs text-orange-700 dark:text-orange-400 font-medium">
                                        Order held pending check-in
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
