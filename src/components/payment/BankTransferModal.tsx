'use client'
// src/components/payment/BankTransferModal.tsx
// Full bank transfer payment modal.
// Shows bank details, 30-min countdown, copy buttons, claim sent CTA.
// After claiming: polls payment status every 5s and redirects on confirmation.

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface BankDetails {
    bank_name?: string
    account_name?: string
    account_number?: string
    sort_code?: string
    routing_number?: string
    iban?: string
}

interface BankTransferModalProps {
    orderId: string
    amount: number
    currency: string
    paymentReference: string
    bankDetails: BankDetails
    onClose: () => void
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵', CAD: 'CA$',
}

function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

export default function BankTransferModal({
    orderId, amount, currency, paymentReference, bankDetails, onClose,
}: BankTransferModalProps) {
    const router = useRouter()
    const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes
    const [expired, setExpired] = useState(false)
    const [claimed, setClaimed] = useState(false)
    const [claiming, setClaiming] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)
    const [claimError, setClaimError] = useState('')

    const symbol = CURRENCY_SYMBOLS[currency] ?? '$'

    // ─── Countdown timer ────────────────────────────────────────────────────
    useEffect(() => {
        if (expired || claimed) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); setExpired(true); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [expired, claimed])

    // ─── Poll for payment confirmation (every 5s after claiming) ───────────
    useEffect(() => {
        if (!claimed) return
        const poll = setInterval(async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}/payment-status`)
                const data = await res.json()
                if (data.payment_status === 'confirmed') {
                    clearInterval(poll)
                    router.push('/dashboard?welcome=true')
                }
            } catch {
                // silently retry
            }
        }, 5000)
        return () => clearInterval(poll)
    }, [claimed, orderId, router])

    // ─── Copy to clipboard ──────────────────────────────────────────────────
    const copy = useCallback(async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(field)
            setTimeout(() => setCopied(null), 1800)
        } catch {
            // Clipboard not available
        }
    }, [])

    // ─── Claim sent ─────────────────────────────────────────────────────────
    const handleClaimSent = async () => {
        setClaiming(true)
        setClaimError('')
        try {
            const res = await fetch('/api/payments/claim-sent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId }),
            })
            if (!res.ok) throw new Error('Could not register claim')
            setClaimed(true)
        } catch (err: any) {
            setClaimError(err.message ?? 'Something went wrong. Please try again.')
        } finally {
            setClaiming(false)
        }
    }

    // ─── Regenerate session ─────────────────────────────────────────────────
    const handleRegenerate = () => {
        setExpired(false)
        setTimeLeft(1800)
    }

    // ─── Build fields list based on currency ────────────────────────────────
    const fields: { label: string; value: string; field: string; note?: string }[] = []

    if (bankDetails.bank_name)
        fields.push({ label: 'Bank', value: bankDetails.bank_name, field: 'bank' })
    if (bankDetails.account_name)
        fields.push({ label: 'Account name', value: bankDetails.account_name, field: 'name' })
    if (bankDetails.account_number)
        fields.push({ label: 'Account number', value: bankDetails.account_number, field: 'acct' })
    if (bankDetails.sort_code)
        fields.push({ label: 'Sort code', value: bankDetails.sort_code, field: 'sort' })
    if (bankDetails.routing_number)
        fields.push({ label: 'Routing number', value: bankDetails.routing_number, field: 'routing' })
    if (bankDetails.iban)
        fields.push({ label: 'IBAN', value: bankDetails.iban, field: 'iban' })

    fields.push({
        label: 'Amount',
        value: `${symbol}${amount.toLocaleString()}`,
        field: 'amount',
    })
    fields.push({
        label: 'Reference / Narration',
        value: paymentReference,
        field: 'ref',
        note: 'Use this exact reference when making the transfer',
    })

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Bank transfer payment"
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem', zIndex: 1000,
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '440px',
                maxHeight: '90vh',
                overflowY: 'auto',
            }}>

                {/* ── Header ── */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #2a2a2a',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                    <div>
                        <p style={{ color: '#888', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                            Transfer exactly
                        </p>
                        <p style={{ fontWeight: 700, fontSize: '1.75rem', color: '#d4a574' }}>
                            {symbol}{amount.toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            background: 'none', border: 'none', color: '#888',
                            cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem',
                            lineHeight: 1,
                        }}
                    >✕</button>
                </div>

                {/* ── Bank detail fields ── */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <p style={{ color: '#888', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                        Transfer to:
                    </p>

                    {fields.map(({ label, value, field, note }) => (
                        <div
                            key={field}
                            style={{
                                background: '#222',
                                border: '1px solid #2a2a2a',
                                borderRadius: '8px',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.75rem',
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: '#666', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                                    {label}
                                </p>
                                <p style={{ fontWeight: 600, color: field === 'ref' ? '#d4a574' : '#f5f5f5', fontSize: '0.92rem', wordBreak: 'break-all' }}>
                                    {value}
                                </p>
                                {note && (
                                    <p style={{ color: '#b8895a', fontSize: '0.75rem', marginTop: '0.2rem' }}>{note}</p>
                                )}
                            </div>
                            <button
                                onClick={() => copy(value, field)}
                                title={`Copy ${label}`}
                                style={{
                                    background: copied === field ? 'rgba(76,175,130,0.15)' : '#2a2a2a',
                                    border: '1px solid',
                                    borderColor: copied === field ? '#4caf82' : '#333',
                                    borderRadius: '6px',
                                    color: copied === field ? '#4caf82' : '#888',
                                    cursor: 'pointer',
                                    padding: '0.4rem 0.65rem',
                                    fontSize: '0.8rem',
                                    flexShrink: 0,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {copied === field ? '✓' : 'Copy'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* ── Confirmation window note ── */}
                <div style={{
                    margin: '0 1.5rem',
                    background: 'rgba(212,165,116,0.06)',
                    border: '1px solid rgba(212,165,116,0.2)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                }}>
                    <p style={{ color: '#c9a05a', fontSize: '0.82rem', lineHeight: '1.5' }}>
                        <strong>Confirmation hours: 8am – 10pm daily.</strong> Transfers confirmed within 2 hours.
                        Transfers after 10pm confirmed from 8am the next day.
                    </p>
                </div>

                {/* ── Timer ── */}
                <div style={{ padding: '0.75rem 1.5rem 0' }}>
                    <p style={{ fontSize: '0.82rem', color: expired ? '#e05555' : '#888' }}>
                        {expired
                            ? '⚠️ Session expired — generate a new session below'
                            : `Session expires in ${formatTime(timeLeft)}`}
                    </p>
                </div>

                {/* ── CTA area ── */}
                <div style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {claimError && (
                        <p style={{ color: '#e05555', fontSize: '0.85rem', background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '6px', padding: '0.65rem 0.85rem' }}>
                            {claimError}
                        </p>
                    )}

                    {/* Active (not claimed, not expired) */}
                    {!claimed && !expired && (
                        <button
                            id="modal-claim-sent"
                            onClick={handleClaimSent}
                            disabled={claiming}
                            style={{
                                width: '100%', padding: '1rem',
                                background: 'transparent',
                                border: '2px solid #2a2a2a',
                                borderRadius: '10px',
                                color: '#f5f5f5',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                cursor: claiming ? 'not-allowed' : 'pointer',
                                opacity: claiming ? 0.6 : 1,
                                transition: 'border-color 0.2s, color 0.2s',
                            }}
                            onMouseEnter={e => { if (!claiming) (e.currentTarget as HTMLButtonElement).style.borderColor = '#4caf82' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a' }}
                        >
                            {claiming ? 'Registering…' : "I've sent the money"}
                        </button>
                    )}

                    {/* Waiting for confirmation */}
                    {claimed && (
                        <div style={{
                            width: '100%', padding: '1rem',
                            background: 'rgba(76,175,130,0.08)',
                            border: '2px solid rgba(76,175,130,0.3)',
                            borderRadius: '10px', textAlign: 'center',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                                <div style={{
                                    width: '16px', height: '16px',
                                    border: '2px solid #4caf82',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                }} />
                                <span style={{ color: '#4caf82', fontWeight: 600, fontSize: '0.92rem' }}>
                                    Waiting for confirmation…
                                </span>
                            </div>
                            <p style={{ color: '#4caf82', fontSize: '0.78rem', opacity: 0.8 }}>
                                You'll be redirected automatically once confirmed
                            </p>
                        </div>
                    )}

                    {/* Expired and not yet claimed */}
                    {expired && !claimed && (
                        <>
                            <button
                                id="modal-regenerate"
                                onClick={handleRegenerate}
                                style={{
                                    width: '100%', padding: '0.9rem',
                                    background: 'transparent',
                                    border: '2px solid #2a2a2a',
                                    borderRadius: '10px',
                                    color: '#f5f5f5', fontWeight: 600,
                                    fontSize: '0.9rem', cursor: 'pointer',
                                }}
                            >
                                Generate new session
                            </button>
                            <button
                                id="modal-already-sent"
                                onClick={handleClaimSent}
                                disabled={claiming}
                                style={{
                                    width: '100%', padding: '0.9rem',
                                    background: 'transparent',
                                    border: '2px solid rgba(212,165,116,0.4)',
                                    borderRadius: '10px',
                                    color: '#d4a574', fontWeight: 600,
                                    fontSize: '0.9rem', cursor: 'pointer',
                                }}
                            >
                                I already sent the money
                            </button>
                        </>
                    )}
                </div>

                {/* Spinner keyframe */}
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    )
}
