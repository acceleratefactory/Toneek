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
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[1000]" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] shadow-xl rounded-2xl w-full max-w-[400px] p-6 relative">
                {content}
            </div>
        </div>
    )

    return (
        <>
            {/* Success message */}
            {success && (
                <div className="bg-toneek-sage/20 border border-toneek-sage/40 rounded-lg p-4">
                    <p className="text-toneek-forest text-sm font-medium leading-relaxed">✓ {success}</p>
                </div>
            )}

            {/* Error message */}
            {error && !modal && (
                <div className="bg-toneek-errorbg border border-toneek-error/20 rounded-lg p-3">
                    <p className="text-toneek-error font-medium text-sm">{error}</p>
                </div>
            )}

            {/* Action buttons */}
            {!success && !isCancelling && (
                <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                    <p className="text-gray-500 dark:text-[#666] text-xs uppercase tracking-wider mb-4 font-bold">
                        Manage plan
                    </p>
                    <div className="flex flex-col gap-3">

                        {/* Upgrade — only for essentials */}
                        {isActive && currentPlan === 'essentials' && (
                            <a
                                href="/subscribe"
                                id="upgrade-plan"
                                className="block text-center p-3 rounded-lg bg-toneek-brown/5 border-2 border-toneek-brown/20 text-toneek-brown font-bold text-sm hover:bg-toneek-brown/10 transition-colors"
                            >
                                ⬆ Upgrade to Full Protocol
                            </a>
                        )}

                        {/* Pause */}
                        {(isActive || isPaused) && (
                            <button
                                id="pause-subscription"
                                onClick={() => { setError(''); setModal('pause') }}
                                className="p-3 rounded-lg bg-transparent border-2 border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-[#ccc] font-bold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
                            >
                                ⏸ {isPaused ? 'Subscription is paused' : 'Pause for 30 days'}
                            </button>
                        )}

                        {/* Cancel */}
                        {isActive && (
                            <button
                                id="cancel-subscription"
                                onClick={() => { setError(''); setCancelReason(''); setModal('cancel') }}
                                className="p-3 rounded-lg bg-transparent border-2 border-toneek-error/30 text-toneek-error font-bold text-sm cursor-pointer hover:bg-toneek-errorbg transition-colors"
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
                    <h3 className="text-gray-900 dark:text-[#f5f5f5] text-lg font-bold mb-2">Pause for 30 days?</h3>
                    <p className="text-gray-600 dark:text-[#888] text-sm leading-relaxed mb-6">
                        Your next delivery will be skipped. Your subscription resumes automatically after 30 days.
                    </p>
                    {error && <p className="text-toneek-error text-xs font-medium mb-3">{error}</p>}
                    <div className="flex gap-3">
                        <button onClick={() => setModal(null)} className="flex-1 p-3 bg-transparent border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-600 dark:text-[#888] font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                            Cancel
                        </button>
                        <button
                            id="confirm-pause"
                            onClick={handlePause}
                            disabled={loading}
                            className="flex-1 p-3 bg-toneek-amber border-none rounded-lg text-black font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:bg-toneek-amber/90 transition-colors"
                        >
                            {loading ? 'Pausing…' : 'Confirm pause'}
                        </button>
                    </div>
                </>
            )}

            {/* ── Cancel modal ── */}
            {modal === 'cancel' && overlay(
                <>
                    <h3 className="text-gray-900 dark:text-[#f5f5f5] text-lg font-bold mb-2">Before you go</h3>
                    <p className="text-gray-600 dark:text-[#888] text-sm mb-4">What's the reason for cancelling?</p>
                    <div className="flex flex-col gap-2 mb-4">
                        {CANCEL_REASONS.map(r => (
                            <button
                                key={r.id}
                                id={`cancel-reason-${r.id}`}
                                onClick={() => setCancelReason(r.id)}
                                className={`p-3 text-left border-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                                    cancelReason === r.id 
                                        ? 'bg-toneek-errorbg border-toneek-error text-toneek-error'
                                        : 'bg-gray-50 border-gray-100 dark:bg-[#222] dark:border-transparent text-gray-700 dark:text-[#ccc] hover:border-gray-200 dark:hover:border-gray-600'
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {error && <p className="text-toneek-error text-xs font-medium mb-3">{error}</p>}
                    <div className="flex gap-3">
                        <button onClick={() => setModal(null)} className="flex-1 p-3 bg-transparent border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-600 dark:text-[#888] font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                            Keep my subscription
                        </button>
                        <button
                            id="confirm-cancel"
                            onClick={handleCancel}
                            disabled={loading || !cancelReason}
                            className="flex-1 p-3 bg-toneek-error border-none rounded-lg text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-toneek-error/90 transition-colors"
                        >
                            {loading ? 'Cancelling…' : 'Confirm cancel'}
                        </button>
                    </div>
                </>
            )}
        </>
    )
}
