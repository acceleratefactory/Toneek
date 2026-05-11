'use client'

import { useState } from 'react'

export default function ChemistReviewForm({ userId, defaultFormula }: { userId: string, defaultFormula: string | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [newFormula, setNewFormula] = useState(defaultFormula || '')
  const [loading, setLoading] = useState(false)

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-xs font-bold rounded shadow-sm transition-colors"
      >
        Confirm Chemist Review
      </button>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/chemist-review/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          chemist_notes: notes,
          new_blacklisted_formula: newFormula.trim() === '' ? null : newFormula.trim()
        })
      })

      if (!res.ok) {
        throw new Error('Failed to resolve chemist review')
      }

      // Reload the page to reflect changes
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert('Error submitting review. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-red-950/20 border border-red-800/30 p-4 rounded-lg mt-4 w-full">
      <h3 className="text-white font-bold text-sm mb-3">Chemist Clinical Resolution</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-red-200 mb-1">Clinical Notes (Visible to Admin)</label>
          <textarea 
            required
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Customer exhibits severe reactivity to salicylic acid. Recommend barrier repair."
            className="w-full bg-white/10 border border-red-500/30 rounded p-2 text-white text-sm placeholder-red-200/50 focus:outline-none focus:border-red-400"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-red-200 mb-1">Add to Blacklist (Formula Code)</label>
          <input 
            type="text"
            value={newFormula}
            onChange={(e) => setNewFormula(e.target.value)}
            placeholder="e.g. GN-SN-01"
            className="w-full bg-white/10 border border-red-500/30 rounded p-2 text-white text-sm placeholder-red-200/50 focus:outline-none focus:border-red-400 font-mono uppercase"
          />
          <p className="text-[10px] text-red-300 mt-1">Leave blank if no specific formula needs to be blacklisted.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-xs font-bold rounded shadow-sm disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Save & Clear Flag'}
          </button>
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="bg-transparent hover:bg-red-900/50 text-red-200 border border-red-500/30 px-4 py-2 text-xs font-bold rounded shadow-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
