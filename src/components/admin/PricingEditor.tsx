'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, RefreshCcw } from 'lucide-react'

interface TierData {
  id: string
  name: string
  description: string
  routine_tier: string
  prices: Record<string, { amount: number; display: string }>
}

export default function PricingEditor({ initialTiers }: { initialTiers: TierData[] }) {
  const router = useRouter()
  // Maintain local state for optimistic UI updates before saving
  const [tiers, setTiers] = useState<TierData[]>(initialTiers)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState<string>('just_one')

  // Supported currencies in the platform
  const currencies = ['NGN', 'GBP', 'USD', 'EUR', 'GHS', 'CAD']

  const handlePriceChange = (tierId: string, currency: string, newAmount: string) => {
    const numAmount = parseInt(newAmount, 10) || 0
    
    // Auto-generate the display string based on the currency rules
    const currencySymbols: Record<string, string> = {
      NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: 'GH₵', CAD: 'CA$'
    }
    
    const displayStr = `${currencySymbols[currency]}${numAmount.toLocaleString()}`

    setTiers(prev => prev.map(t => {
      if (t.id !== tierId) return t
      return {
        ...t,
        prices: {
          ...t.prices,
          [currency]: { amount: numAmount, display: displayStr }
        }
      }
    }))
  }

  const savePrices = async (tier: TierData) => {
    setSavingId(tier.id)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tier.id, prices: tier.prices })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update prices')
      }

      setSuccessMsg(`${tier.name} pricing updated globally!`)
      router.refresh() // Refreshes server data on next load
      
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      
      {(successMsg || errorMsg) && (
         <div className={`p-4 rounded-lg font-medium text-sm flex items-center justify-between ${successMsg ? 'bg-toneek-sage text-toneek-forest border border-toneek-sage' : 'bg-toneek-errorbg text-toneek-error border border-toneek-errorbg'}`}>
            <span>{successMsg || errorMsg}</span>
         </div>
      )}

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('just_one')}
          className={`whitespace-nowrap py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'just_one'
              ? 'border-toneek-amber text-toneek-amber'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Just One Product
        </button>
        <button
          onClick={() => setActiveTab('two_to_three')}
          className={`whitespace-nowrap py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'two_to_three'
              ? 'border-toneek-amber text-toneek-amber'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Two to Three Products
        </button>
        <button
          onClick={() => setActiveTab('whatever_it_takes')}
          className={`whitespace-nowrap py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'whatever_it_takes'
              ? 'border-toneek-amber text-toneek-amber'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Full Routine
        </button>
      </div>

      {tiers.filter((tier) => tier.routine_tier === activeTab).map((tier) => (
        <div key={tier.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
             <div>
               <h2 className="text-lg font-bold text-gray-900">{tier.name}</h2>
               <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
             </div>
             <button 
               onClick={() => savePrices(tier)} 
               disabled={savingId === tier.id}
               className="bg-toneek-brown hover:bg-[#1A1210] disabled:opacity-50 text-white px-5 py-2 rounded shadow-sm text-sm font-bold transition-all flex items-center gap-2"
             >
               {savingId === tier.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
               {savingId === tier.id ? 'Deploying...' : 'Deploy Global Pricing'}
             </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currencies.map(curr => {
                const currentPrice = tier.prices[curr] || { amount: 0, display: `${curr}0` }
                
                return (
                  <div key={curr} className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                       {curr} Market Structure
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 font-medium sm:text-sm">{curr}</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={currentPrice.amount || ''}
                        onChange={(e) => handlePriceChange(tier.id, curr, e.target.value)}
                        className="block w-full rounded-md border-gray-300 pl-14 py-2.5 text-gray-900 focus:border-toneek-amber focus:ring-toneek-amber sm:text-sm font-bold bg-gray-50/50 border transition-colors font-mono"
                        placeholder="0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                         <span className="text-xs font-bold text-toneek-brown bg-toneek-cream border border-toneek-lightgray px-2 py-0.5 rounded font-mono">
                           {currentPrice.display}
                         </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
