'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function DailyCheckForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayParam = searchParams.get('day')
  const day = dayParam ? parseInt(dayParam) : 1

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSelect = async (response: 'happy' | 'neutral' | 'concerned') => {
    setStatus('submitting')
    setError(null)
    try {
      const res = await fetch('/api/daily-check/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, response })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')

      setStatus('success')
    } catch (err: any) {
      setError(err.message)
      setStatus('idle')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto mt-12 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you</h2>
        <p className="text-gray-600 mb-6">Your check-in has been logged.</p>
        <Link href="/dashboard" className="bg-toneek-brown text-white px-6 py-2 rounded-lg font-bold">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto mt-12 text-left">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Day {day} Check-in</h2>
      <p className="text-gray-600 mb-8">How is your skin feeling today?</p>

      {error && <div className="text-red-600 bg-red-50 p-3 rounded mb-6 text-sm">{error}</div>}

      <div className="space-y-4">
        <button
          onClick={() => handleSelect('happy')}
          disabled={status === 'submitting'}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span className="text-2xl">😊</span>
          <span className="font-bold text-gray-900">Happy — all good</span>
        </button>

        <button
          onClick={() => handleSelect('neutral')}
          disabled={status === 'submitting'}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span className="text-2xl">😐</span>
          <span className="font-bold text-gray-900">Neutral — not sure yet</span>
        </button>

        <button
          onClick={() => handleSelect('concerned')}
          disabled={status === 'submitting'}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <span className="text-2xl">😟</span>
          <span className="font-bold text-gray-900">Concerned — feels off</span>
        </button>
      </div>
    </div>
  )
}

export default function DailyCheckPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6">
      <Suspense fallback={<div className="text-center mt-12">Loading...</div>}>
        <DailyCheckForm />
      </Suspense>
    </div>
  )
}
