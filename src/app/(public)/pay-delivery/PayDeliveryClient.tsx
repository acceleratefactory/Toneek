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
  deliveryFees: Record<string, number>
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
  initialAddress,
  deliveryFees
}: PayDeliveryClientProps) {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'address' | 'payment'>('address')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>('')
  
  const [addressData, setAddressData] = useState({
    address: initialAddress.address || '',
    city: initialAddress.city || '',
    state: initialAddress.state || ''
  })

  const REGION_OPTIONS = [
    { key: 'delivery_fee_ngn_lagos', label: 'Nigeria — Lagos', currency: 'NGN' },
    { key: 'delivery_fee_ngn_outside_lagos', label: 'Nigeria — Outside Lagos', currency: 'NGN' },
    { key: 'delivery_fee_ngn_international', label: 'Nigeria — International', currency: 'NGN' },
    { key: 'delivery_fee_gbp_uk', label: 'United Kingdom', currency: 'GBP' },
    { key: 'delivery_fee_usd_usa', label: 'United States', currency: 'USD' },
    { key: 'delivery_fee_eur_europe', label: 'Europe', currency: 'EUR' },
    { key: 'delivery_fee_ghs_ghana', label: 'Ghana', currency: 'GHS' },
  ]

  const isPendingSelection = amount === 0
  const displayAmount = isPendingSelection && selectedRegionKey ? deliveryFees[selectedRegionKey] : amount
  const displayCurrency = isPendingSelection && selectedRegionKey 
    ? REGION_OPTIONS.find(o => o.key === selectedRegionKey)?.currency || currency 
    : currency

  const symbol = displayCurrency === 'NGN' ? '₦' : displayCurrency === 'GBP' ? '£' : displayCurrency === 'USD' ? '$' : displayCurrency
  const displayPlan = planTier.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const handleContinue = async () => {
    if (isPendingSelection && !selectedRegionKey) {
      alert("Please select a delivery region")
      return
    }

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
          order_id: orderId,
          deliveryRegion: selectedRegionKey,
          deliveryFee: displayAmount,
          currency: displayCurrency,
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
            <span className="text-sm font-black text-[#3D1A0E]">
              {isPendingSelection && !selectedRegionKey 
                ? 'Select region' 
                : `${symbol}${displayAmount?.toLocaleString()}`}
            </span>
          </div>
        </div>

        {step === 'address' ? (
          <div className="space-y-4">
            <h3 className="font-bold text-[#3D1A0E]">Delivery Address</h3>
            
            {isPendingSelection && (
              <div>
                <label className="block text-xs font-bold text-[#8B7365] mb-1">Delivery Region</label>
                <div className="relative">
                  <select 
                    value={selectedRegionKey}
                    onChange={e => setSelectedRegionKey(e.target.value)}
                    className="w-full border border-[#E8E0DA] rounded-lg px-3 py-2.5 text-sm text-[#3D1A0E] focus:outline-none focus:ring-2 focus:ring-[#C87D3E] bg-white appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Select your region --</option>
                    {REGION_OPTIONS.map(opt => {
                      if (deliveryFees[opt.key] === undefined) return null;
                      return <option key={opt.key} value={opt.key}>{opt.label}</option>
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#8B7365] text-xs">
                    ▼
                  </div>
                </div>
              </div>
            )}
            
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
               Pay {symbol}{displayAmount?.toLocaleString()}
             </button>
          </div>
        )}
      </div>

      {showModal && (
        <BankTransferModal
          orderId={orderId}
          amount={displayAmount}
          currency={displayCurrency}
          paymentReference={paymentReference}
          bankDetails={bankDetails}
          onClose={() => setShowModal(false)}
          isDeliveryOnly={true}
        />
      )}
    </div>
  )
}
