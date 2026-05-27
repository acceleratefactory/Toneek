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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedData, setGeneratedData] = useState<{ link: string, amount: number, currency: string, token: string } | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError('')

    const payload = { order_id: orderId, region: 'pending' }

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

    const message = `Hi ${firstName},

Your personalised Toneek formula is ready! 🎉

To receive your delivery, please open the link below to select your region and make a small delivery payment:

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
    
    const subject = "Your free Toneek formula is ready for dispatch!"
    const body = `Hi ${firstName},

Your personalised Toneek formula is ready! 🎉

To receive your delivery, please open the link below to select your region and make a small delivery payment:

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


      {error && <p className="text-red-600 text-sm mb-4 font-medium px-3 py-2 bg-red-50 rounded border border-red-100">{error}</p>}

      {!generatedData ? (
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          className="w-full bg-[#3D1A0E] hover:bg-[#2A0F06] text-white py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
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
