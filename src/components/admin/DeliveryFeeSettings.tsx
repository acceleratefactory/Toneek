'use client'

import React, { useEffect, useState } from 'react'

interface Setting {
  key: string
  value: string
}

const SETTING_LABELS: Record<string, string> = {
  'delivery_fee_ngn_lagos': 'Nigeria — Lagos (₦)',
  'delivery_fee_ngn_outside_lagos': 'Nigeria — Outside Lagos (₦)',
  'delivery_fee_ngn_international': 'Nigeria — International (₦)',
  'delivery_fee_gbp_uk': 'United Kingdom (£)',
  'delivery_fee_usd_usa': 'United States ($)',
  'delivery_fee_eur_europe': 'Europe (€)',
  'delivery_fee_ghs_ghana': 'Ghana (GH₵)',
}

export default function DeliveryFeeSettings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      // Only keep the allowed delivery fee keys
      const deliverySettings = data.filter((s: Setting) => Object.keys(SETTING_LABELS).includes(s.key))
      setSettings(deliverySettings)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key)
    setError('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (!res.ok) throw new Error('Failed to update setting')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-6">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
        <h2 className="text-sm font-bold text-gray-800">Delivery Fees Configuration</h2>
      </div>
      <div className="p-6">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(SETTING_LABELS).map((key) => {
            const setting = settings.find((s) => s.key === key)
            const value = setting ? setting.value : ''
            
            return (
              <div key={key} className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 mb-1">{SETTING_LABELS[key]}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => {
                      const newSettings = [...settings]
                      const idx = newSettings.findIndex(s => s.key === key)
                      if (idx >= 0) {
                        newSettings[idx].value = e.target.value
                      } else {
                        newSettings.push({ key, value: e.target.value })
                      }
                      setSettings(newSettings)
                    }}
                    className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-toneek-brown"
                  />
                  <button
                    onClick={() => handleUpdate(key, value)}
                    disabled={savingKey === key}
                    className="bg-toneek-brown hover:bg-[#2A0F06] text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {savingKey === key ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
