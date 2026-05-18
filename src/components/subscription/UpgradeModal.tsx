// src/components/subscription/UpgradeModal.tsx
'use client'

import { useState } from 'react'

interface UpgradeModalProps {
  currentPlan: string          // 'essentials'
  targetPlan: string           // 'full_protocol'
  currency: string             // 'NGN', 'GBP', etc.
  currentAmount: number        // what they pay now
  newAmount: number            // what the upgrade costs
  formulaCode: string          // their current formula code
  onClose: () => void
  onConfirm: () => void        // triggers the bank transfer modal
}

const PLAN_DISPLAY: Record<string, string> = {
  essentials: 'Essentials',
  full_protocol: 'Full Protocol',
  restoration: 'Restoration Protocol',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵', CAD: 'CA$'
}

const UPGRADE_BENEFITS: Record<string, string[]> = {
  // What the customer GAINS by upgrading from essentials to full_protocol
  full_protocol: [
    'Skin OS Score tracked and updated at every check-in',
    'Priority formula reformulation if Week 8 response is insufficient',
    'Full morning and evening routine sequencing guide',
    'Skin response monitoring across 8 clinical metrics',
    'Week 2, 4, 8 clinical outcome tracking — detailed analysis',
    'Cleanser and moisturiser updated when formula is reformulated',
  ],
  restoration: [
    'Three-phase progressive formula system',
    '12-month barrier restoration plan',
    'Twice-daily application protocol (AM + PM)',
    'Dedicated clinical review at month 3 and month 6',
    'All products change when your protocol phase changes',
    'Highest priority reformulation and product adjustment',
  ],
}

export default function UpgradeModal({
  currentPlan, targetPlan, currency, currentAmount, 
  newAmount, formulaCode, onClose, onConfirm
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const symbol = CURRENCY_SYMBOLS[currency] ?? ''
  const benefits = UPGRADE_BENEFITS[targetPlan] ?? []
  const priceDiff = newAmount - currentAmount

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center 
                    justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md 
                      shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6" style={{ background: '#2A0F06' }}>
          <p className="text-xs uppercase tracking-widest mb-1"
             style={{ color: '#C87D3E' }}>Upgrading your plan</p>
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold">
              {PLAN_DISPLAY[currentPlan]}
            </span>
            <span style={{ color: '#C87D3E' }}>→</span>
            <span className="font-bold text-lg" style={{ color: '#C87D3E' }}>
              {PLAN_DISPLAY[targetPlan]}
            </span>
          </div>
          <p className="text-sm mt-2" style={{ color: '#F7F1EB', opacity: 0.7 }}>
            Your formula {formulaCode} and all clinical data carry over exactly.
          </p>
        </div>

        {/* Price comparison */}
        <div className="px-6 py-4 border-b" 
             style={{ borderColor: '#E8E0DA', background: '#F7F1EB' }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-wide" 
                 style={{ color: '#8C7B72' }}>Current</p>
              <p className="font-medium" style={{ color: '#8C7B72' }}>
                {symbol}{currentAmount.toLocaleString()}/month
              </p>
            </div>
            <span style={{ color: '#C87D3E', fontSize: '20px' }}>→</span>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide" 
                 style={{ color: '#8C7B72' }}>New price</p>
              <p className="text-xl font-bold" style={{ color: '#2A0F06' }}>
                {symbol}{newAmount.toLocaleString()}/month
              </p>
            </div>
          </div>
          {priceDiff > 0 && (
            <p className="text-xs mt-2 text-center" style={{ color: '#8C7B72' }}>
              +{symbol}{priceDiff.toLocaleString()}/month for these additional features:
            </p>
          )}
        </div>

        {/* Benefits gained */}
        <div className="px-6 py-4">
          <p className="text-xs uppercase tracking-widest mb-3" 
             style={{ color: '#8C7B72' }}>What you gain</p>
          <ul className="space-y-2">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span style={{ color: '#1C5C3A', minWidth: '16px' }}>✓</span>
                <span style={{ color: '#2A0F06' }}>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Reassurance note */}
        <div className="mx-6 mb-4 p-3 rounded-lg text-xs"
             style={{ background: '#E8F2EC', color: '#1C5C3A' }}>
          <strong>No new assessment required.</strong> Your formula, 
          clinical data, and check-in schedule stay exactly the same.
          Only your plan tier changes.
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-white disabled:opacity-70"
            style={{ background: '#2A0F06' }}
          >
            {loading ? 'Processing...' : 'Confirm upgrade — proceed to payment'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm"
            style={{ color: '#8C7B72' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
