'use client'
// src/components/dashboard/SubscriptionActions.tsx
// Pause, cancel, and upgrade actions for the subscription management page.

import { useState } from 'react'

const CANCEL_REASONS = [
    { id: 'too_expensive',           label: 'Too expensive'                         },
    { id: 'results_not_expected',    label: 'Results not what I expected'           },
    { id: 'need_a_break',            label: 'I need a break'                        },
    { id: 'moving',                  label: 'Moving / change of circumstances'      },
    { id: 'medical_reason',          label: 'Medical reason'                        },
    { id: 'other',                   label: 'Other'                                 },
]

interface SubscriptionActionsProps {
    subscriptionId: string
    currentPlan: string
    status: string
}

export default function SubscriptionActions({ subscriptionId, currentPlan, status }: SubscriptionActionsProps) {
    const [modal,         setModal]         = useState<'pause' | 'cancel' | 'upgrade' | null>(null)
    const [cancelReason,  setCancelReason]  = useState('')
    const [loading,       setLoading]       = useState(false)
    const [success,       setSuccess]       = useState('')
    const [error,         setError]         = useState('')

    const isActive     = status === 'active'
    const isPaused     = status === 'paused'
    const isCancelling = status === 'cancelling' || status === 'cancelled'

    const callApi = async (path: string, body: Record<string, any>) => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(path, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Request failed')
            return data
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong')
            return null
        } finally {
            setLoading(false)
        }
    }

    const handlePause = async () => {
        const data = await callApi(`/api/subscriptions/${subscriptionId}/pause`, {})
        if (data) {
            setSuccess('Your subscription has been paused for 30 days. Your next delivery will be skipped.')
            setModal(null)
        }
    }

    const handleCancel = async () => {
        if (!cancelReason) { setError('Please select a reason'); return }
        const data = await callApi(`/api/subscriptions/${subscriptionId}/cancel`, { reason: cancelReason })
        if (data) {
            setSuccess('Your subscription will end on your next billing date. You can reactivate anytime.')
            setModal(null)
        }
    }

    // ── Modals ────────────────────────────────────────────────────────────────

    const overlay = (content: React.ReactNode) => (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', zIndex: 1000,
        }} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
                {content}
            </div>
        </div>
    )

    return (
        <>
            {/* Success message */}
            {success && (
                <div style={{ background: 'rgba(76,175,130,0.08)', border: '1px solid rgba(76,175,130,0.3)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                    <p style={{ color: '#4caf82', fontSize: '0.88rem', lineHeight: '1.5' }}>✓ {success}</p>
                </div>
            )}

            {/* Error message */}
            {error && !modal && (
                <div style={{ background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                    <p style={{ color: '#e05555', fontSize: '0.85rem' }}>{error}</p>
                </div>
            )}

            {/* Action buttons */}
            {!success && !isCancelling && (
                <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                    <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                        Manage plan
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                        {/* Upgrade — only for essentials */}
                        {isActive && currentPlan === 'essentials' && (
                            <a
                                href="/subscribe"
                                id="upgrade-plan"
                                style={{
                                    display: 'block', textAlign: 'center',
                                    padding: '0.85rem', borderRadius: '10px',
                                    background: 'rgba(212,165,116,0.1)',
                                    border: '1.5px solid rgba(212,165,116,0.4)',
                                    color: '#d4a574', fontWeight: 600,
                                    fontSize: '0.9rem', textDecoration: 'none',
                                }}
                            >
                                ⬆ Upgrade to Full Protocol
                            </a>
                        )}

                        {/* Pause */}
                        {(isActive || isPaused) && (
                            <button
                                id="pause-subscription"
                                onClick={() => { setError(''); setModal('pause') }}
                                style={{
                                    padding: '0.85rem', borderRadius: '10px',
                                    background: 'transparent', border: '1.5px solid #2a2a2a',
                                    color: '#ccc', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                                }}
                            >
                                ⏸ {isPaused ? 'Subscription is paused' : 'Pause for 30 days'}
                            </button>
                        )}

                        {/* Cancel */}
                        {isActive && (
                            <button
                                id="cancel-subscription"
                                onClick={() => { setError(''); setCancelReason(''); setModal('cancel') }}
                                style={{
                                    padding: '0.85rem', borderRadius: '10px',
                                    background: 'transparent', border: '1.5px solid rgba(224,85,85,0.3)',
                                    color: '#e05555', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                                }}
                            >
                                Cancel subscription
                            </button>
                        )}
                    </div>
                </section>
            )}

            {/* ── Pause modal ── */}
            {modal === 'pause' && overlay(
                <>
                    <h3 style={{ color: '#f5f5f5', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>Pause for 30 days?</h3>
                    <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                        Your next delivery will be skipped. Your subscription resumes automatically after 30 days.
                    </p>
                    {error && <p style={{ color: '#e05555', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setModal(null)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button
                            id="confirm-pause"
                            onClick={handlePause}
                            disabled={loading}
                            style={{ flex: 1, padding: '0.8rem', background: '#e09a3a', border: 'none', borderRadius: '8px', color: '#0f0f0f', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
                        >
                            {loading ? 'Pausing…' : 'Confirm pause'}
                        </button>
                    </div>
                </>
            )}

            {/* ── Cancel modal ── */}
            {modal === 'cancel' && overlay(
                <>
                    <h3 style={{ color: '#f5f5f5', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Before you go</h3>
                    <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>What's the reason for cancelling?</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                        {CANCEL_REASONS.map(r => (
                            <button
                                key={r.id}
                                id={`cancel-reason-${r.id}`}
                                onClick={() => setCancelReason(r.id)}
                                style={{
                                    padding: '0.7rem 0.9rem', textAlign: 'left',
                                    background: cancelReason === r.id ? 'rgba(224,85,85,0.1)' : '#222',
                                    border: `1.5px solid ${cancelReason === r.id ? '#e05555' : '#2a2a2a'}`,
                                    borderRadius: '8px', color: cancelReason === r.id ? '#e05555' : '#ccc',
                                    fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {error && <p style={{ color: '#e05555', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setModal(null)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', cursor: 'pointer' }}>
                            Keep my subscription
                        </button>
                        <button
                            id="confirm-cancel"
                            onClick={handleCancel}
                            disabled={loading || !cancelReason}
                            style={{ flex: 1, padding: '0.8rem', background: '#e05555', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: loading || !cancelReason ? 'not-allowed' : 'pointer', opacity: loading || !cancelReason ? 0.5 : 1 }}
                        >
                            {loading ? 'Cancelling…' : 'Confirm cancel'}
                        </button>
                    </div>
                </>
            )}
        </>
    )
}
