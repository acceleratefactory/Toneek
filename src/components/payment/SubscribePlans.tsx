'use client'
// src/components/payment/SubscribePlans.tsx
// Plan selection UI. Displays 3 plans in customer's currency.
// On plan click → calls /api/orders/create → opens BankTransferModal.

import { useState } from 'react'
import dynamic from 'next/dynamic'

const BankTransferModal = dynamic(() => import('./BankTransferModal'), { ssr: false })

const PLANS = [
    {
        id: 'essentials',
        name: 'Essentials',
        description: 'Your personalised formula. Monthly delivery.',
        features: [
            'Monthly personalised formula',
            'Full active ingredient breakdown',
            'Climate-matched formulation',
            'WhatsApp delivery updates',
        ],
        prices: {
            NGN: { amount: 18000, display: '₦18,000' },
            GBP: { amount: 35, display: '£35' },
            USD: { amount: 45, display: '$45' },
            EUR: { amount: 38, display: '€38' },
            GHS: { amount: 250, display: 'GH₵250' },
            CAD: { amount: 55, display: 'CA$55' },
        },
        highlight: false,
    },
    {
        id: 'full_protocol',
        name: 'Full Protocol',
        description: 'Formula + clinical outcome tracking + priority reformulation.',
        features: [
            'Everything in Essentials',
            'Skin OS Score tracking every 4 weeks',
            'Priority formula reformulation',
            'Skin response monitoring',
        ],
        highlight: true,
        prices: {
            NGN: { amount: 22000, display: '₦22,000' },
            GBP: { amount: 42, display: '£42' },
            USD: { amount: 55, display: '$55' },
            EUR: { amount: 48, display: '€48' },
            GHS: { amount: 320, display: 'GH₵320' },
            CAD: { amount: 70, display: 'CA$70' },
        },
    },
    {
        id: 'restoration',
        name: 'Restoration Protocol',
        description: 'Three-phase barrier repair. 12-month programme.',
        features: [
            'Everything in Full Protocol',
            '3-phase progressive formula system',
            '12-month barrier restoration plan',
            'Dedicated clinical review at month 3 and 6',
        ],
        highlight: false,
        prices: {
            NGN: { amount: 35000, display: '₦35,000' },
            GBP: { amount: 68, display: '£68' },
            USD: { amount: 88, display: '$88' },
            EUR: { amount: 75, display: '€75' },
            GHS: { amount: 500, display: 'GH₵500' },
            CAD: { amount: 110, display: 'CA$110' },
        },
    },
]

interface SubscribePlansProps {
    assessmentId: string
    userId: string | null
    currency: string
}

interface ModalData {
    orderId: string
    amount: number
    currency: string
    paymentReference: string
    bankDetails: {
        bank_name: string
        account_name: string
        account_number?: string
        sort_code?: string
        routing_number?: string
        iban?: string
    }
}

export default function SubscribePlans({ assessmentId, userId, currency }: SubscribePlansProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [modal, setModal] = useState<ModalData | null>(null)

    const handleSelect = async (planId: string) => {
        setLoading(planId)
        setError('')

        try {
            const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessment_id: assessmentId,
                    user_id: userId,
                    plan_tier: planId,
                    currency,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Could not create order')

            setModal({
                orderId: data.order_id,
                amount: data.amount,
                currency: data.currency,
                paymentReference: data.payment_reference,
                bankDetails: data.bank_details,
            })
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong. Please try again.')
        } finally {
            setLoading(null)
        }
    }

    const curr = currency as keyof typeof PLANS[0]['prices']

    return (
        <>
            {/* Plan cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {PLANS.map(plan => {
                    const price = plan.prices[curr] ?? plan.prices['USD']
                    const isLoading = loading === plan.id

                    return (
                        <div
                            key={plan.id}
                            style={{
                                background: plan.highlight ? 'rgba(212,165,116,0.06)' : 'var(--surface)',
                                border: plan.highlight ? '1px solid var(--accent)' : '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                position: 'relative',
                            }}
                        >
                            {plan.highlight && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--accent)',
                                    color: '#0f0f0f',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    padding: '0.25rem 0.85rem',
                                    borderRadius: '20px',
                                    whiteSpace: 'nowrap',
                                }}>
                                    Most popular
                                </span>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)', marginBottom: '0.2rem' }}>
                                        {plan.name}
                                    </p>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                        {plan.description}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                                    <p style={{ fontWeight: 700, fontSize: '1.4rem', color: plan.highlight ? 'var(--accent)' : 'var(--foreground)' }}>
                                        {price.display}
                                    </p>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>/month</p>
                                </div>
                            </div>

                            <ul style={{ margin: '0 0 1.25rem', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {plan.features.map((feature, i) => (
                                    <li key={i} style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                id={`plan-${plan.id}`}
                                onClick={() => handleSelect(plan.id)}
                                disabled={!!loading}
                                className="btn-primary"
                                style={{ width: '100%', opacity: loading && !isLoading ? 0.5 : 1 }}
                            >
                                {isLoading ? 'Setting up…' : `Choose ${plan.name}`}
                            </button>
                        </div>
                    )
                })}
            </div>

            {error && <p className="error-message" style={{ marginTop: '1rem' }}>{error}</p>}

            {/* Bank Transfer Modal */}
            {modal && (
                <BankTransferModal
                    orderId={modal.orderId}
                    amount={modal.amount}
                    currency={modal.currency}
                    paymentReference={modal.paymentReference}
                    bankDetails={modal.bankDetails}
                    onClose={() => setModal(null)}
                />
            )}
        </>
    )
}
