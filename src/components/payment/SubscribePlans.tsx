'use client'
// src/components/payment/SubscribePlans.tsx
// Plan selection UI. Displays 3 plans in customer's currency.
// On plan click → calls /api/orders/create → opens BankTransferModal.

import { useState } from 'react'
import dynamic from 'next/dynamic'

const BankTransferModal = dynamic(() => import('./BankTransferModal'), { ssr: false })



interface SubscribePlansProps {
    assessmentId: string
    userId: string | null
    currency: string
    plans: any[]
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

export default function SubscribePlans({ assessmentId, userId, currency, plans }: SubscribePlansProps) {
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

    return (
        <>
            {/* Plan cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {plans.map((plan: any) => {
                    const price = plan.prices[currency] ?? plan.prices['USD']
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
                                {plan.features.map((feature: string, i: number) => (
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
