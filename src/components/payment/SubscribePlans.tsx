'use client'
// src/components/payment/SubscribePlans.tsx
// Plan selection UI. Displays 3 plans in customer's currency.
// On plan click → calls /api/orders/create → opens BankTransferModal.

import { useState } from 'react'
import dynamic from 'next/dynamic'

const BankTransferModal = dynamic(() => import('./BankTransferModal'), { ssr: false })



import { PLAN_FEATURES, RoutineTier, PlanTier } from '@/lib/plans/planFeatures'

interface SubscribePlansProps {
    assessmentId: string
    userId: string | null
    currency: string
    plans: any[]
    routineTier?: string
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

export default function SubscribePlans({ assessmentId, userId, currency, plans, routineTier = 'just_one' }: SubscribePlansProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [modal, setModal] = useState<ModalData | null>(null)

    const getPlanKey = (planName: string): PlanTier => {
        const name = planName.toLowerCase().trim()
        if (name.includes('restoration')) return 'restoration'
        if (name.includes('full')) return 'full_protocol'
        return 'essentials'
    }

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

    const validRoutineTier = (routineTier || 'just_one') as RoutineTier

    return (
        <>
            {/* Plan cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {plans.map((plan: any) => {
                    const price = plan.prices[currency] ?? plan.prices['USD']
                    const isLoading = loading === plan.id
                    
                    const planKey = getPlanKey(plan.name)
                    const planContent = PLAN_FEATURES[validRoutineTier]?.[planKey]

                    // If for some reason planContent is not found, fallback to original plan object
                    const description = planContent?.description || plan.description
                    const features = planContent?.features || plan.features || []
                    const upgradeHook = planContent?.upgrade_hook

                    return (
                        <div
                            key={plan.id}
                            style={{
                                background: planKey === 'full_protocol' ? '#FEF9F4' : 'var(--surface)',
                                border: planKey === 'full_protocol' ? '2px solid #C87D3E' : '1px solid #E8E0DA',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                position: 'relative',
                            }}
                        >
                            {planKey === 'full_protocol' && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#C87D3E',
                                    color: '#fff',
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
                                    <p className="dark:text-white" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--foreground)', marginBottom: '0.2rem' }}>
                                        {plan.name}
                                        {planKey === 'restoration' && (
                                            <span style={{ background: '#22543D', color: '#fff', fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.05em' }}>
                                                CLINICAL
                                            </span>
                                        )}
                                    </p>
                                    <p className="dark:text-gray-400" style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                        {description}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                                    <p className="dark:text-white" style={{ fontWeight: 700, fontSize: '1.4rem', color: planKey === 'full_protocol' ? '#C87D3E' : 'var(--foreground)' }}>
                                        {price.display || `${currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : '$'}${price.toLocaleString()}`}
                                    </p>
                                    <p className="dark:text-gray-400" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>/month</p>
                                </div>
                            </div>
                            
                            {upgradeHook && (
                                <p className="text-[13px] text-[#C87D3E] italic mb-4 font-medium">
                                    {upgradeHook}
                                </p>
                            )}

                            <ul style={{ margin: '0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {features.map((feature: string, i: number) => (
                                    <li key={i} className="dark:text-gray-300" style={{ color: 'var(--muted)', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: '#C87D3E', flexShrink: 0 }}>✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {planKey === 'restoration' && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.75rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                                    Restoration Protocol is our most intensive system. It delivers the greatest results when your assessment confirms barrier damage. For most profiles, Full Protocol provides equivalent outcome tracking and priority reformulation.
                                </p>
                            )}

                            <button
                                id={`plan-${plan.id}`}
                                onClick={() => handleSelect(plan.id)}
                                disabled={!!loading}
                                className={planKey === 'restoration' ? '' : 'btn-primary'}
                                style={{ 
                                    width: '100%', 
                                    marginTop: '1.25rem',
                                    opacity: loading && !isLoading ? 0.5 : 1,
                                    ...(planKey === 'restoration' 
                                        ? { background: '#22543D', color: '#fff', padding: '0.85rem', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' } 
                                        : {})
                                }}
                            >
                                {isLoading ? 'Setting up…' : `Choose ${plan.name}`}
                            </button>
                        </div>
                    )
                })}
            </div>

            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)', marginTop: '1.5rem', fontFamily: 'var(--font-jost), sans-serif' }}>
                Not sure which plan? Full Protocol is recommended for most profiles. Restoration Protocol is assigned — not chosen.
            </p>

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
