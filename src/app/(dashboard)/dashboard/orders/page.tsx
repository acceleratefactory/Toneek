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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f5f5f5' }}>My Orders</h1>

            {/* ── Held order banner — most important UI ── */}
            {heldOrder && HELD_MESSAGES[heldOrder.dispatch_held_reason!] && (() => {
                const { week, text } = HELD_MESSAGES[heldOrder.dispatch_held_reason!]
                return (
                    <div
                        role="alert"
                        style={{
                            background: 'rgba(224,154,58,0.08)',
                            border: '2px solid rgba(224,154,58,0.4)',
                            borderRadius: '12px',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div>
                            <p style={{ color: '#e09a3a', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                                ⏸ Order on hold
                            </p>
                            <p style={{ color: '#c48830', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                {text} Complete it now so we can dispatch your formula.
                            </p>
                        </div>
                        <a
                            href={`/dashboard/checkin?week=${week}`}
                            id="held-order-checkin-cta"
                            style={{
                                display: 'inline-block',
                                padding: '0.65rem 1.1rem',
                                background: '#e09a3a',
                                color: '#0f0f0f',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Complete Week {week} check-in →
                        </a>
                    </div>
                )
            })()}

            {/* ── Orders list ── */}
            {!orders || orders.length === 0 ? (
                <div style={{
                    background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px',
                    padding: '2.5rem', textAlign: 'center',
                }}>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>No orders yet.</p>
                    <p style={{ color: '#555', fontSize: '0.82rem', marginTop: '0.4rem' }}>
                        Your first order is created once your payment is confirmed.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {orders.map(order => {
                        const cfg    = STATUS_CONFIG[order.status] ?? { label: order.status, colour: '#888', bg: 'rgba(136,136,136,0.1)' }
                        const isHeld = !!order.dispatch_held_reason

                        return (
                            <div
                                key={order.id}
                                id={`order-${order.id}`}
                                style={{
                                    background: '#1a1a1a',
                                    border: `1px solid ${isHeld ? 'rgba(224,154,58,0.3)' : '#222'}`,
                                    borderRadius: '12px',
                                    padding: '1.25rem 1.5rem',
                                }}
                            >
                                {/* Top row — ref + status badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div>
                                        <p style={{ fontFamily: 'monospace', color: '#f5f5f5', fontWeight: 700, fontSize: '0.92rem', letterSpacing: '0.02em' }}>
                                            {order.payment_reference ?? order.id.slice(0, 8).toUpperCase()}
                                        </p>
                                        <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                                            {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                    <span style={{
                                        background: cfg.bg,
                                        color: cfg.colour,
                                        border: `1px solid ${cfg.colour}30`,
                                        borderRadius: '20px',
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        flexShrink: 0,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Detail rows */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {order.formula_code && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666', fontSize: '0.82rem' }}>Formula</span>
                                            <span style={{ color: '#d4a574', fontSize: '0.82rem', fontWeight: 600 }}>{order.formula_code}</span>
                                        </div>
                                    )}
                                    {order.plan_tier && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666', fontSize: '0.82rem' }}>Plan</span>
                                            <span style={{ color: '#888', fontSize: '0.82rem', textTransform: 'capitalize' }}>
                                                {order.plan_tier.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    )}
                                    {order.payment_amount && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666', fontSize: '0.82rem' }}>Amount</span>
                                            <span style={{ color: '#888', fontSize: '0.82rem' }}>
                                                {SYMBOLS[order.currency] ?? ''}{order.payment_amount?.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {order.dispatched_at && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666', fontSize: '0.82rem' }}>Dispatched</span>
                                            <span style={{ color: '#4caf82', fontSize: '0.82rem' }}>{formatDate(order.dispatched_at)}</span>
                                        </div>
                                    )}
                                    {order.tracking_number && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#666', fontSize: '0.82rem' }}>Tracking</span>
                                            <span style={{ color: '#888', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                                                {order.courier && <span style={{ marginRight: '0.4rem' }}>{order.courier}</span>}
                                                {order.tracking_number}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Held inline note */}
                                {isHeld && (
                                    <div style={{
                                        marginTop: '0.85rem',
                                        background: 'rgba(224,154,58,0.06)',
                                        border: '1px solid rgba(224,154,58,0.2)',
                                        borderRadius: '6px',
                                        padding: '0.6rem 0.85rem',
                                        fontSize: '0.78rem',
                                        color: '#c48830',
                                    }}>
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
