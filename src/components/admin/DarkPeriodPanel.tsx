'use client'

import { useState } from 'react'

type DarkPeriodResponse = {
  id: string
  day_number: number
  response: 'happy' | 'neutral' | 'concerned'
  response_channel: string
  responded_at: string
  admin_alerted: boolean
  admin_alert_dismissed: boolean
}

export default function DarkPeriodPanel({ responses }: { responses: DarkPeriodResponse[] }) {
  const [localResponses, setLocalResponses] = useState(responses)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const handleResolve = async (id: string) => {
    setResolvingId(id)
    try {
      const res = await fetch('/api/admin/dark-period/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!res.ok) throw new Error('Failed to resolve alert')

      setLocalResponses(prev => prev.map(r => r.id === id ? { ...r, admin_alert_dismissed: true } : r))
    } catch (error) {
      console.error(error)
      alert('Failed to resolve alert.')
    } finally {
      setResolvingId(null)
    }
  }

  if (localResponses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🌒</span> Dark Period Check-ins (Days 1-5)
          </h2>
        </div>
        <div className="p-6 text-gray-500 text-sm flex items-center gap-3">
          <span>No early check-ins recorded yet.</span>
        </div>
      </div>
    )
  }

  const getEmoji = (response: string) => {
    if (response === 'happy') return '😊'
    if (response === 'neutral') return '😐'
    if (response === 'concerned') return '😟'
    return '?'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
           <span className="text-xl">🌒</span> Dark Period Check-ins (Days 1-5)
        </h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {localResponses.map((res) => {
          const isAlert = res.admin_alerted && !res.admin_alert_dismissed
          return (
            <li key={res.id} className={`p-4 ${isAlert ? 'bg-red-50' : ''}`}>
              <div className="flex justify-between items-center">
                <p className="font-bold text-sm text-gray-900">Day {res.day_number}</p>
                <span className="text-xs text-gray-500">{new Date(res.responded_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                 <div className="flex items-center gap-3">
                   <span className="text-2xl">{getEmoji(res.response)}</span>
                   <div>
                     <p className="text-sm font-bold text-gray-800 capitalize">{res.response}</p>
                     <p className="text-[10px] text-gray-500">via {res.response_channel}</p>
                   </div>
                 </div>
                 {isAlert && (
                   <button
                     onClick={() => handleResolve(res.id)}
                     disabled={resolvingId === res.id}
                     className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                   >
                     {resolvingId === res.id ? 'Resolving...' : 'Resolve Alert'}
                   </button>
                 )}
                 {res.admin_alerted && res.admin_alert_dismissed && (
                   <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                     <span>✅</span> Resolved
                   </span>
                 )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
