'use client'

import { useState } from 'react'

type Note = {
  id: string
  note_text: string
  note_type: string
  created_at: string
  sent_at?: string
  sent_via?: string
}

export default function ChemistCopilotPanel({ customerId, initialNotes }: { customerId: string, initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [draft, setDraft] = useState('')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'generating' | 'sending' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})

  const handleGenerate = async () => {
    setStatus('generating')
    setError(null)
    try {
      const res = await fetch('/api/admin/chemist-copilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate draft')
      
      setDraft(data.draft)
      setNoteId(data.note_id)
      setStatus('idle')
    } catch (err: any) {
      setError(err.message)
      setStatus('idle')
    }
  }

  const handleSend = async (send_via: 'email' | 'whatsapp' | 'both') => {
    if (!noteId) {
      setError('No active draft to send.')
      return
    }

    setStatus('sending')
    setError(null)

    try {
      const res = await fetch('/api/admin/chemist-copilot/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_id: noteId,
          final_text: draft,
          send_via
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send note')

      setStatus('success')
      
      // Add the new note to the list locally
      setNotes([{
        id: noteId,
        note_text: draft,
        note_type: 'ai_approved',
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        sent_via: send_via
      }, ...notes])

      // Clear draft UI
      setTimeout(() => {
        setDraft('')
        setNoteId(null)
        setStatus('idle')
      }, 2000)

    } catch (err: any) {
      setError(err.message)
      setStatus('idle')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <span className="text-xl">✨</span> Chemist Copilot
        </h2>
      </div>

      <div className="p-6">
        {/* Draft Area */}
        {draft ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Review & Edit Draft</label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full h-40 p-4 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-toneek-forest focus:border-transparent transition-all shadow-inner"
                placeholder="Edit your clinical note here..."
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {draft.length} characters
              </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
            {status === 'success' && <div className="text-sm text-green-700 bg-green-50 p-3 rounded font-bold">✅ Note sent successfully!</div>}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => handleSend('email')}
                disabled={status === 'sending' || status === 'success'}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {status === 'sending' ? 'Sending...' : 'Send by Email'}
              </button>
              <button
                onClick={() => handleSend('whatsapp')}
                disabled={status === 'sending' || status === 'success'}
                className="px-4 py-2 bg-[#25D366] text-white rounded text-sm font-bold hover:bg-[#20B056] transition-colors disabled:opacity-50"
              >
                Send by WhatsApp
              </button>
              <button
                onClick={() => handleSend('both')}
                disabled={status === 'sending' || status === 'success'}
                className="px-4 py-2 bg-toneek-brown text-white rounded text-sm font-bold hover:bg-[#1A1210] transition-colors shadow-sm disabled:opacity-50"
              >
                Send Both
              </button>
              <button
                onClick={() => { setDraft(''); setNoteId(null); setError(null); }}
                className="px-4 py-2 text-gray-500 text-sm font-bold hover:text-gray-700 underline"
              >
                Discard
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">Generate a personalized clinical note based on this customer's journey, concerns, and outcomes.</p>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">{error}</div>}
            <button
              onClick={handleGenerate}
              disabled={status === 'generating'}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {status === 'generating' ? '⏳ Analyzing journey...' : '✨ Draft with AI'}
            </button>
          </div>
        )}

        {/* Past Notes History */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
             Past Clinical Notes
          </h3>
          
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500">No clinical notes recorded yet.</p>
          ) : (
            <ul className="space-y-4">
              {notes.map(note => {
                const isExpanded = expandedNotes[note.id]
                const isSent = note.note_type === 'ai_approved' || note.note_type === 'manual'
                
                return (
                  <li key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                          note.note_type === 'ai_drafted' ? 'bg-amber-100 text-amber-800' : 'bg-toneek-sage text-toneek-forest'
                        }`}>
                          {note.note_type === 'ai_drafted' ? 'Draft' : 'Sent'}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      {isSent && note.sent_via && (
                        <span className="text-xs text-gray-400 capitalize">
                          Via {note.sent_via}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-800 whitespace-pre-wrap mt-2">
                      {isExpanded ? note.note_text : `${note.note_text.substring(0, 80)}${note.note_text.length > 80 ? '...' : ''}`}
                    </div>
                    
                    {note.note_text.length > 80 && (
                      <button 
                        onClick={() => toggleExpand(note.id)}
                        className="text-xs text-toneek-brown font-bold mt-2 hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Read full note'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
