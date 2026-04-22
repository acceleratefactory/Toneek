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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white dark:bg-[#1A1210] border border-gray-200 dark:border-[#333] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative">

                {/* ── Header ── */}
                <div className="p-6 border-b border-gray-100 dark:border-[#333] flex justify-between items-start">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                            Transfer exactly
                        </p>
                        <p className="font-black text-3xl text-toneek-amber tracking-tighter">
                            {symbol}{amount.toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-2xl leading-none p-1"
                    >✕</button>
                </div>

                {/* ── Bank detail fields ── */}
                <div className="p-6 flex flex-col gap-3">
                    <p className="text-gray-900 dark:text-gray-100 text-xs font-bold uppercase tracking-wider mb-1">
                        Transfer to:
                    </p>

                    {fields.map(({ label, value, field, note }) => (
                        <div
                            key={field}
                            className="bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-xl p-4 flex justify-between items-center gap-3 transition-colors hover:border-toneek-amber/50"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                                    {label}
                                </p>
                                <p className={`font-bold text-[15px] break-all tracking-tight ${field === 'ref' ? 'text-toneek-brown font-mono' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {value}
                                </p>
                                {note && (
                                    <p className="text-toneek-brown dark:text-[#b8895a] text-[10px] font-bold mt-1.5 uppercase tracking-wide">{note}</p>
                                )}
                            </div>
                            <button
                                onClick={() => copy(value, field)}
                                title={`Copy ${label}`}
                                className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                    copied === field 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
                                        : 'bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#444]'
                                }`}
                            >
                                {copied === field ? '✓ Copied' : 'Copy'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* ── Confirmation window note ── */}
                <div className="mx-6 bg-toneek-amber/10 border border-toneek-amber/20 rounded-xl p-4">
                    <p className="text-toneek-brown dark:text-[#c9a05a] text-xs leading-relaxed font-medium">
                        <strong>Confirmation hours: 8am – 10pm daily.</strong> Transfers confirmed within 2 hours.
                        Transfers after 10pm confirmed from 8am the next day.
                    </p>
                </div>

                {/* ── Timer ── */}
                <div className="px-6 pt-5 text-center">
                    <p className={`text-[11px] font-bold uppercase tracking-widest ${expired ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {expired
                            ? '⚠️ Session expired — generate a new session below'
                            : `Session expires in ${formatTime(timeLeft)}`}
                    </p>
                </div>

                {/* ── CTA area ── */}
                <div className="p-6 flex flex-col gap-3">
                    {claimError && (
                        <p className="text-red-600 dark:text-red-400 text-xs font-medium bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg p-3 text-center">
                            {claimError}
                        </p>
                    )}

                    {!claimed && !expired && (
                        <button
                            id="modal-claim-sent"
                            onClick={handleClaimSent}
                            disabled={claiming}
                            className={`w-full py-4 rounded-xl font-bold text-sm transition-all border-2 
                                ${claiming 
                                    ? 'bg-gray-100 dark:bg-[#222] border-gray-200 dark:border-[#333] text-gray-400 cursor-not-allowed' 
                                    : 'bg-white dark:bg-[#1A1210] border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#222]'
                                }
                            `}
                        >
                            {claiming ? 'Registering…' : "I've sent the money"}
                        </button>
                    )}

                    {claimed && (
                        <div className="w-full p-4 bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-900/30 rounded-xl text-center mt-2">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-green-700 dark:text-green-400 font-bold text-[13px] uppercase tracking-wider">
                                    Waiting for confirmation…
                                </span>
                            </div>
                            <p className="text-green-600/80 dark:text-green-400/80 text-[10px] uppercase font-bold tracking-widest mt-1">
                                You'll be redirected automatically
                            </p>
                        </div>
                    )}

                    {expired && !claimed && (
                        <>
                            <button
                                id="modal-regenerate"
                                onClick={handleRegenerate}
                                className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm rounded-xl border-transparent border-2 hover:opacity-90 transition-opacity"
                            >
                                Generate new session
                            </button>
                            <button
                                id="modal-already-sent"
                                onClick={handleClaimSent}
                                disabled={claiming}
                                className="w-full py-3.5 bg-transparent border-2 border-toneek-amber text-toneek-amber font-bold text-sm rounded-xl hover:bg-toneek-amber/10 transition-colors"
                            >
                                I already sent the money
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    )
}
