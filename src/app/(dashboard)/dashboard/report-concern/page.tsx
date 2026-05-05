'use client'

// src/app/(dashboard)/dashboard/report-concern/page.tsx
// Dedicated emergency concern reporting page.
// Available at all times — completely separate from the standard check-in schedule.

import { useState, useRef } from 'react'

const PRODUCT_OPTIONS = [
  { id: 'formula',     label: 'My Toneek Formula' },
  { id: 'cleanser',   label: 'Toneek Barrier Cleanser' },
  { id: 'moisturiser', label: 'Toneek Lightweight Moisturiser' },
  { id: 'spf',        label: 'Toneek Mineral SPF 50' },
  { id: 'toner_brt',  label: 'Toneek Brightening Toner' },
  { id: 'toner_hyd',  label: 'Toneek Hydrating Toner' },
  { id: 'unsure',     label: 'Not sure which product' },
]

const SEVERITY_OPTIONS = [
  { id: 'mild',     label: 'Mild',     sub: 'Slight tingling or redness that is fading' },
  { id: 'moderate', label: 'Moderate', sub: 'Persistent redness, burning or visible irritation' },
  { id: 'severe',   label: 'Severe',   sub: 'Significant reaction — I have stopped all products' },
]

export default function ReportConcernPage() {
  const [step, setStep]                   = useState(1)
  const [suspectedProduct, setSuspectedProduct] = useState('')
  const [severity, setSeverity]           = useState('')
  const [description, setDescription]     = useState('')
  const [dayOfProtocol, setDayOfProtocol] = useState('')
  const [photoFile, setPhotoFile]         = useState<File | null>(null)
  const [photoPreview, setPhotoPreview]   = useState<string | null>(null)
  const [submitting, setSubmitting]       = useState(false)
  const [submitted, setSubmitted]         = useState(false)
  const [error, setError]                 = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!description.trim() || !severity || !suspectedProduct) return
    setSubmitting(true)
    setError('')

    try {
      let photo_url: string | null = null
      if (photoFile) {
        const uploadFd = new FormData()
        uploadFd.append('file', photoFile)
        const uploadRes = await fetch('/api/checkin/upload-photo', { method: 'POST', body: uploadFd })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          photo_url = uploadData.url
        }
      }

      const res = await fetch('/api/report-concern/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suspected_product: suspectedProduct,
          severity,
          description,
          day_of_protocol: dayOfProtocol,
          photo_url,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <div className="bg-white dark:bg-[#1a1a1a] border border-green-500/40 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Your concern has been received
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
            Our clinical team has been alerted immediately and will contact you within a few hours.
            Please <strong>stop applying the suspected product</strong> until you hear from us.
          </p>
          <a
            href="/dashboard/formula"
            className="inline-block px-8 py-3 bg-[#2A0F06] text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  const TOTAL_STEPS = 3

  return (
    <div className="max-w-xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div className="bg-white dark:bg-[#261B18] pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 dark:border-[#3A2820] -mt-8 sm:-mt-8 mx-[-1rem] sm:mx-[-2rem] mb-2 relative pb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-red-600 text-xl">⚠</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Report a Concern</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Step {step} of {TOTAL_STEPS} — Our team will be alerted immediately on submission
        </p>
      </div>

      {/* Urgency banner */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex items-start gap-3">
        <span className="text-red-600 text-base flex-shrink-0 mt-0.5">⚠</span>
        <p className="text-sm text-red-700 dark:text-red-400 leading-snug">
          <strong>Stop applying the suspected product now.</strong> Complete this form and our clinical team will contact you within a few hours.
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-200 dark:bg-[#1a1a1a] rounded-sm h-1 overflow-hidden">
        <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      {/* ── Step 1: Which product & severity ── */}
      {step === 1 && (
        <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm flex flex-col gap-6">
          {/* Suspected product */}
          <div>
            <p className="text-gray-800 dark:text-gray-200 font-bold text-base mb-3">
              Which product do you suspect?
            </p>
            <div className="flex flex-col gap-2">
              {PRODUCT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSuspectedProduct(opt.id)}
                  className={`text-left w-full rounded-lg p-3 text-sm font-medium transition-all outline-none border-2 ${
                    suspectedProduct === opt.id
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-400'
                      : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <p className="text-gray-800 dark:text-gray-200 font-bold text-base mb-3">
              How severe is the reaction?
            </p>
            <div className="flex flex-col gap-2">
              {SEVERITY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSeverity(opt.id)}
                  className={`text-left w-full rounded-lg p-3.5 transition-all outline-none border-2 ${
                    severity === opt.id
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-400'
                      : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <p className={`font-bold text-sm mb-0.5 ${severity === opt.id ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {opt.label}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!suspectedProduct || !severity}
            className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
              suspectedProduct && severity
                ? 'bg-red-600 text-white cursor-pointer hover:bg-red-700'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
            }`}
          >
            Continue
          </button>
        </section>
      )}

      {/* ── Step 2: Description & Day ── */}
      {step === 2 && (
        <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm flex flex-col gap-5">
          <div>
            <label className="block text-gray-800 dark:text-gray-200 font-bold text-base mb-2">
              Describe what you are experiencing
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Burning sensation on cheeks and forehead 10 minutes after applying the formula. Redness that has not faded after 30 minutes..."
              rows={5}
              className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm outline-none resize-y focus:border-red-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-800 dark:text-gray-200 font-bold text-base mb-2">
              What day of your protocol are you on? <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={dayOfProtocol}
              onChange={e => setDayOfProtocol(e.target.value)}
              placeholder="e.g. Day 3"
              className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-red-400 transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-transparent border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors">Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!description.trim()}
              className={`flex-[2] py-3 rounded-lg font-bold text-sm transition-all ${
                description.trim()
                  ? 'bg-red-600 text-white cursor-pointer hover:bg-red-700'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {/* ── Step 3: Photo & Submit ── */}
      {step === 3 && (
        <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm flex flex-col gap-5">
          <div>
            <p className="text-gray-800 dark:text-gray-200 font-bold text-base mb-1">
              Upload a photo of the affected area <span className="text-gray-500 font-normal">(optional)</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
              A photo helps our clinical team assess the reaction accurately and respond faster.
            </p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            {photoPreview ? (
              <div className="mb-4 text-center">
                <img src={photoPreview} alt="Preview" className="w-full max-h-[220px] object-cover rounded-lg border border-gray-200 dark:border-[#2a2a2a]" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  className="mt-2 text-red-500 text-xs font-semibold hover:underline"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-10 bg-gray-50 dark:bg-[#222] border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-xl text-gray-500 text-sm font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2a2a]/50 transition-colors"
              >
                + Tap to upload a photo
              </button>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 dark:bg-red-900/10 rounded-lg p-3">{error}</p>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 bg-transparent border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors">Back</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-[2] py-3 rounded-lg font-bold text-sm transition-all ${
                !submitting ? 'bg-red-600 text-white cursor-pointer hover:bg-red-700' : 'bg-red-400 text-white cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting…' : 'Submit concern report'}
            </button>
          </div>
          <p
            onClick={handleSubmit}
            className="text-gray-500 text-xs text-center mt-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
          >
            Skip photo and submit →
          </p>
        </section>
      )}
    </div>
  )
}
