'use client'

// Phase I: Clinical Governance — Admin Review Panel
// Renders a decision UI for concern reports that are still in 'pending_review' status.
// Admin must either confirm the formula incompatibility (permanent) or release the
// hold by providing a mandatory clinical note explaining the root cause (user error).

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConcernReviewPanelProps {
  concernId: string
  formulaCode: string
  customerName: string
}

export default function ConcernReviewPanel({ concernId, formulaCode, customerName }: ConcernReviewPanelProps) {
  const router = useRouter()
  const [mode, setMode] = useState<null | 'confirm' | 'release'>(null)
  const [clinicalNote, setClinicalNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleDecision = async () => {
    if (!mode) return
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/concern-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concern_id: concernId,
          action: mode,
          admin_clinical_note: clinicalNote,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Something went wrong.')
        setIsSubmitting(false)
        return
      }

      // Refresh the page to show the updated timeline entry
      router.refresh()

    } catch (err) {
      setError('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
        <span>⏳</span> Pending Clinical Review
      </p>
      <p className="text-xs text-amber-700 mb-3">
        Formula <span className="font-mono font-bold">{formulaCode}</span> is on provisional hold for <span className="font-bold">{customerName}</span>. Please review and make a clinical decision.
      </p>

      {/* Decision buttons — shown before a mode is selected */}
      {!mode && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMode('confirm')}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded shadow-sm transition-colors"
          >
            🚫 Confirm Incompatibility
          </button>
          <button
            onClick={() => setMode('release')}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded shadow-sm transition-colors"
          >
            🔓 Release Hold (User Error)
          </button>
        </div>
      )}

      {/* Confirm incompatibility — no note required, just a confirmation */}
      {mode === 'confirm' && (
        <div className="mt-2 space-y-3">
          <p className="text-xs text-red-700 font-medium bg-red-50 border border-red-200 rounded p-2">
            ⚠️ This will permanently blacklist formula <span className="font-mono font-bold">{formulaCode}</span> for this customer. This action is recorded and cannot be automatically reversed.
          </p>
          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleDecision}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded shadow-sm transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Confirm Permanently'}
            </button>
            <button
              onClick={() => { setMode(null); setError('') }}
              disabled={isSubmitting}
              className="bg-white border border-gray-300 text-gray-600 text-xs font-bold px-3 py-2 rounded shadow-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Release hold — mandatory clinical note required */}
      {mode === 'release' && (
        <div className="mt-2 space-y-3">
          <p className="text-xs text-green-700 font-medium bg-green-50 border border-green-200 rounded p-2">
            🔓 You are releasing the hold on formula <span className="font-mono font-bold">{formulaCode}</span>. A mandatory clinical note explaining the root cause is required.
          </p>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Clinical Note — Root Cause <span className="text-red-500">*</span>
            </label>
            <textarea
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="e.g. Customer applied on freshly waxed skin — protocol failure, not formula incompatibility. Formula is clinically appropriate."
              rows={3}
              className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">Minimum 10 characters required. This note is permanently stored on the patient record.</p>
          </div>
          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleDecision}
              disabled={isSubmitting || clinicalNote.trim().length < 10}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded shadow-sm transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Release Hold'}
            </button>
            <button
              onClick={() => { setMode(null); setError(''); setClinicalNote('') }}
              disabled={isSubmitting}
              className="bg-white border border-gray-300 text-gray-600 text-xs font-bold px-3 py-2 rounded shadow-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
