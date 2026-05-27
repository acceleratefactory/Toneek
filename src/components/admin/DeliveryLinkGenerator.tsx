'use client'

import React, { useState } from 'react'

interface DeliveryLinkGeneratorProps {
  orderId: string
  customerName: string
  formulaCode?: string
  planTier: string
  paymentReference: string
  deliveryFees: Record<string, { amount: number; currency: string; label: string }>
  customerPhone?: string
}

export default function DeliveryLinkGenerator({
  orderId,
  customerName,
  formulaCode,
  planTier,
  paymentReference,
  customerPhone
}: Omit<DeliveryLinkGeneratorProps, 'deliveryFees'>) {
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedData, setGeneratedData] = useState<{ link: string, amount: number, currency: string, token: string } | null>(null)
  
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({})
  const [feesLoading, setFeesLoading] = useState(true)

  React.useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setDeliveryFees(data.fees ?? {})
        setFeesLoading(false)
      })
      .catch(() => setFeesLoading(false))
  }, [])

  const REGION_OPTIONS = [
    { key: 'delivery_fee_ngn_lagos', label: 'Nigeria — Lagos', currency: 'NGN' },
    { key: 'delivery_fee_ngn_outside_lagos', label: 'Nigeria — Outside Lagos', currency: 'NGN' },
    { key: 'delivery_fee_ngn_international', label: 'Nigeria — International', currency: 'NGN' },
    { key: 'delivery_fee_gbp_uk', label: 'United Kingdom', currency: 'GBP' },
    { key: 'delivery_fee_usd_usa', label: 'United States', currency: 'USD' },
    { key: 'delivery_fee_eur_europe', label: 'Europe', currency: 'EUR' },
    { key: 'delivery_fee_ghs_ghana', label: 'Ghana', currency: 'GHS' },
  ]

  const handleGenerate = async () => {
    if (!selectedRegion) {
      setError('Please select a delivery region')
      return
    }

    setLoading(true)
    setError('')

    const payload: any = { order_id: orderId }
    if (selectedRegion === 'custom') {
      const amountNum = parseFloat(customAmount)
      if (isNaN(amountNum) || amountNum <= 0) {
        setError('Please enter a valid custom amount')
        setLoading(false)
        return
      }
      payload.region = 'custom'
      payload.custom_amount = amountNum
      payload.custom_currency = 'NGN' // Default custom currency
    } else {
      payload.region = selectedRegion
    }

    try {
      const res = await fetch('/api/admin/generate-delivery-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate link')

      setGeneratedData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (generatedData) {
      navigator.clipboard.writeText(generatedData.link)
      alert('Link copied to clipboard')
    }
  }

  const handleWhatsApp = () => {
    if (!generatedData) return

    const firstName = customerName.split(' ')[0]
    const symbol = generatedData.currency === 'NGN' ? '₦' : generatedData.currency === 'GBP' ? '£' : generatedData.currency === 'USD' ? '$' : generatedData.currency
    
    const message = `Hi ${firstName},

Your personalised Toneek formula is ready! 🎉

To receive your delivery, please make a small delivery payment:
${symbol}${generatedData.amount.toLocaleString()} to the details on this page:

${generatedData.link}

Your formula will be dispatched as soon as payment is confirmed.`

    const encoded = encodeURIComponent(message)
    const phone = customerPhone ? customerPhone.replace('+', '') : ''
    const waUrl = `https://wa.me/${phone}?text=${encoded}`
    window.open(waUrl, '_blank')
  }

  const handleEmail = () => {
    if (!generatedData) return
    const firstName = customerName.split(' ')[0]
    const symbol = generatedData.currency === 'NGN' ? '₦' : generatedData.currency === 'GBP' ? '£' : generatedData.currency === 'USD' ? '$' : generatedData.currency
    
    const subject = "Your free Toneek formula is ready for dispatch!"
    const body = `Hi ${firstName},

Your personalised Toneek formula is ready! 🎉

To receive your delivery, please make a small delivery payment:
${symbol}${generatedData.amount.toLocaleString()} to the details on this page:

${generatedData.link}

Your formula will be dispatched as soon as payment is confirmed.`

    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }

  // Format plan tier display name
  const displayPlanTier = planTier.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div className="bg-white border border-[#E8E0DA] rounded-xl p-6 w-full max-w-2xl font-sans">
      <h3 className="text-sm font-bold text-[#3D1A0E] tracking-wider uppercase mb-4 flex items-center gap-2">
        <span className="text-[#C87D3E]">🚚</span> Generate Delivery Payment Link
      </h3>
      
      <div className="bg-[#FCFAF8] p-4 rounded-lg mb-6 border border-[#F0EAE5] text-sm text-[#5C453A]">
        <div className="grid grid-cols-3 gap-2">
          <div className="font-semibold text-[#8B7365]">Customer:</div>
          <div className="col-span-2 font-bold text-[#3D1A0E]">{customerName}</div>
          
          <div className="font-semibold text-[#8B7365]">Formula:</div>
          <div className="col-span-2 font-mono font-bold">{formulaCode || 'TBD'} <span className="font-sans text-xs font-normal text-[#8B7365] bg-white border border-[#F0EAE5] px-2 py-0.5 rounded ml-2">{displayPlanTier}</span></div>
          
          <div className="font-semibold text-[#8B7365]">Order Ref:</div>
          <div className="col-span-2 font-mono text-xs">{paymentReference}</div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-[#3D1A0E] mb-3">Delivery region:</label>
        <div className="space-y-3">
          {feesLoading ? (
            <p className="text-sm text-gray-500 italic py-2">Loading delivery options...</p>
          ) : (
            REGION_OPTIONS.map(option => {
              const fee = deliveryFees[option.key]
              if (fee === undefined) return null
              const symbol = option.currency === 'NGN' ? '₦' : option.currency === 'GBP' ? '£' : option.currency === 'USD' ? '$' : option.currency
              return (
                <label key={option.key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#FCFAF8] rounded-md transition-colors">
                  <input 
                    type="radio" 
                    name="delivery_region" 
                    value={option.key} 
                    checked={selectedRegion === option.key}
                    onChange={() => {
                      setSelectedRegion(option.key)
                      setCustomAmount('')
                    }}
                    className="w-4 h-4 text-[#C87D3E] focus:ring-[#C87D3E] border-gray-300"
                  />
                  <span className="flex-1 text-sm text-[#3D1A0E] font-medium">{option.label}</span>
                  <span className="text-sm font-bold text-[#3D1A0E]">{symbol}{fee.toLocaleString()}</span>
                </label>
              )
            })
          )}
          
          <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#FCFAF8] rounded-md transition-colors">
            <input 
              type="radio" 
              name="delivery_region" 
              value="custom" 
              checked={selectedRegion === 'custom'}
              onChange={() => setSelectedRegion('custom')}
              className="w-4 h-4 text-[#C87D3E] focus:ring-[#C87D3E] border-gray-300"
            />
            <span className="text-sm text-[#3D1A0E] font-medium w-32">Custom amount:</span>
            {selectedRegion === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">₦</span>
                <input 
                  type="number" 
                  className="border border-[#E8E0DA] rounded p-1 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-[#C87D3E]"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
          </label>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4 font-medium px-3 py-2 bg-red-50 rounded border border-red-100">{error}</p>}

      {!generatedData ? (
        <button 
          onClick={handleGenerate} 
          disabled={loading || !selectedRegion}
          className="w-full bg-[#3D1A0E] hover:bg-[#2A0F06] text-white py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate delivery link'}
        </button>
      ) : (
        <div className="mt-6 pt-6 border-t border-dashed border-[#E8E0DA]">
          <p className="text-xs font-bold text-[#8B7365] uppercase tracking-wider mb-2">Link generated successfully:</p>
          
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              readOnly 
              value={generatedData.link} 
              className="flex-1 bg-[#FCFAF8] border border-[#E8E0DA] rounded-md px-3 py-2 text-sm font-mono text-[#3D1A0E] outline-none"
            />
            <button 
              onClick={handleCopy}
              className="bg-[#FCFAF8] hover:bg-[#F0EAE5] border border-[#E8E0DA] text-[#3D1A0E] px-4 py-2 rounded-md font-bold text-sm transition-colors"
            >
              Copy
            </button>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-2.5 rounded-md font-bold text-sm transition-colors shadow-sm"
            >
              <span>💬</span> Send via WhatsApp
            </button>
            <button 
              onClick={handleEmail}
              className="flex-1 bg-white hover:bg-[#FCFAF8] border border-[#E8E0DA] text-[#3D1A0E] py-2.5 rounded-md font-bold text-sm transition-colors"
            >
              ✉️ Send via Email
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
