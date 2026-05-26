'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'

const BankTransferModal = dynamic(() => import('@/components/payment/BankTransferModal'), { ssr: false })

interface PayDeliveryClientProps {
  orderId: string
  amount: number
  currency: string
  paymentReference: string
  bankDetails: any
  customerName: string
  formulaCode: string
  planTier: string
}

export default function PayDeliveryClient({
  orderId,
  amount,
  currency,
  paymentReference,
  bankDetails,
  customerName,
  formulaCode,
  planTier
}: PayDeliveryClientProps) {
  const [showModal, setShowModal] = useState(false)

  const symbol = currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency
  const displayPlan = planTier.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div className="max-w-md mx-auto mt-12 mb-20 bg-white border border-[#E8E0DA] rounded-2xl shadow-sm overflow-hidden font-sans">
      <div className="bg-[#FCFAF8] p-6 border-b border-[#E8E0DA] text-center">
        <h1 className="text-[#3D1A0E] text-xl font-bold mb-2">Delivery Payment</h1>
        <p className="text-[#8B7365] text-sm">Secure your dispatch for {customerName}</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-[#FCFAF8] rounded-xl p-4 border border-[#F0EAE5]">
          <h3 className="text-xs font-bold text-[#8B7365] uppercase tracking-wider mb-3">Order Summary</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#5C453A] text-sm">Formula</span>
            <span className="font-mono font-bold text-[#3D1A0E]">{formulaCode || 'TBD'}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#5C453A] text-sm">Plan</span>
            <span className="text-sm font-bold text-[#3D1A0E]">{displayPlan}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#5C453A] text-sm">Formula Cost</span>
            <span className="text-[#1C5C3A] font-bold text-sm bg-[#E8F3EC] px-2 py-0.5 rounded">FREE ✓</span>
          </div>
        </div>

        <div className="flex justify-between items-end border-b border-dashed border-[#E8E0DA] pb-4">
          <span className="text-[#5C453A] font-medium">Delivery Fee</span>
          <div className="text-right">
            <span className="text-2xl font-black text-[#3D1A0E]">{symbol}{amount.toLocaleString()}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="w-full bg-[#3D1A0E] hover:bg-[#2A0F06] text-white py-4 rounded-xl font-bold transition-colors shadow-sm text-lg"
        >
          Pay {symbol}{amount.toLocaleString()}
        </button>
      </div>

      {showModal && (
        <BankTransferModal
          orderId={orderId}
          amount={amount}
          currency={currency}
          paymentReference={paymentReference}
          bankDetails={bankDetails}
          onClose={() => setShowModal(false)}
          isDeliveryOnly={true}
        />
      )}
    </div>
  )
}
