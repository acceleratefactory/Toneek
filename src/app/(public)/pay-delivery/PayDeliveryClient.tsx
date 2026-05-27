'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'

const BankTransferModal = dynamic(() => import('@/components/payment/BankTransferModal'), { ssr: false })

interface PayDeliveryClientProps {
  orderId: string
  userId: string
  amount: number
  currency: string
  paymentReference: string
  bankDetails: any
  customerName: string
  formulaCode: string
  planTier: string
  initialAddress: {
    address: string
    city: string
    state: string
  }
}

export default function PayDeliveryClient({
  orderId,
  userId,
  amount,
  currency,
  paymentReference,
  bankDetails,
  customerName,
  formulaCode,
  planTier,
  initialAddress
}: PayDeliveryClientProps) {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'address' | 'payment'>('address')
  const [isSaving, setIsSaving] = useState(false)
  
  const [addressData, setAddressData] = useState({
    address: initialAddress.address || '',
    city: initialAddress.city || '',
    state: initialAddress.state || ''
  })

  const symbol = currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency
  const displayPlan = planTier.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const handleContinue = async () => {
    if (!addressData.address || !addressData.city || !addressData.state) {
      alert("Please fill in all address fields")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/save-delivery-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...addressData
        })
      })
      if (res.ok) {
        setStep('payment')
        setShowModal(true)
      } else {
        alert("Failed to save address. Please try again.")
      }
    } catch (e) {
      alert("Error saving address. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

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
          <div className="flex justify-between items-center border-b border-[#E8E0DA] pb-2 mb-2">
            <span className="text-[#5C453A] text-sm">Formula Cost</span>
            <span className="text-[#1C5C3A] font-bold text-sm bg-[#E8F3EC] px-2 py-0.5 rounded">FREE ✓</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#5C453A] font-bold text-sm">Delivery Fee</span>
            <span className="text-sm font-black text-[#3D1A0E]">{symbol}{amount.toLocaleString()}</span>
          </div>
        </div>

        {step === 'address' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-[#3D1A0E]">Delivery Address</h3>
            <div>
              <label className="block text-xs font-bold text-[#8B7365] mb-1">Street Address</label>
              <input 
                type="text" 
                value={addressData.address}
                onChange={e => setAddressData({...addressData, address: e.target.value})}
                className="w-full border border-[#E8E0DA] rounded-lg px-3 py-2 text-sm text-[#3D1A0E] focus:outline-none focus:ring-2 focus:ring-[#C87D3E]"
                placeholder="123 Example Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#8B7365] mb-1">City</label>
                <input 
                  type="text" 
                  value={addressData.city}
                  onChange={e => setAddressData({...addressData, city: e.target.value})}
                  className="w-full border border-[#E8E0DA] rounded-lg px-3 py-2 text-sm text-[#3D1A0E] focus:outline-none focus:ring-2 focus:ring-[#C87D3E]"
                  placeholder="Lekki"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8B7365] mb-1">State / Country</label>
                <input 
                  type="text" 
                  value={addressData.state}
                  onChange={e => setAddressData({...addressData, state: e.target.value})}
                  className="w-full border border-[#E8E0DA] rounded-lg px-3 py-2 text-sm text-[#3D1A0E] focus:outline-none focus:ring-2 focus:ring-[#C87D3E]"
                  placeholder="Lagos"
                />
              </div>
            </div>
            <button 
              onClick={handleContinue}
              disabled={isSaving}
              className="w-full bg-[#3D1A0E] hover:bg-[#2A0F06] text-white py-4 rounded-xl font-bold transition-colors shadow-sm text-lg mt-4 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Continue to Payment'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm text-green-800 font-medium">
               Address confirmed. Proceeding to payment.
             </div>
             <button 
               onClick={() => setShowModal(true)}
               className="w-full bg-[#3D1A0E] hover:bg-[#2A0F06] text-white py-4 rounded-xl font-bold transition-colors shadow-sm text-lg"
             >
               Pay {symbol}{amount.toLocaleString()}
             </button>
          </div>
        )}
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
