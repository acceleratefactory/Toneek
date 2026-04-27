'use client'
// src/app/(dashboard)/dashboard/checkin/page.tsx
// 4-step check-in form. Reachable from nav and from email link (?week=4).
// Step 1: Improvement score (1–5)
// Step 2: Adverse reactions
// Step 3: Changes since last check-in
// Step 4: Photo upload (optional)
// On submit: POST /api/checkin/submit

import { Suspense } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
const SCORE_OPTIONS = [
    { value: 1, label: 'No change',      sub: 'Skin feels the same as when I started' },
    { value: 2, label: 'Slight',         sub: 'Small differences, hard to be sure'      },
    { value: 3, label: 'Noticeable',     sub: 'I can see a real difference'             },
    { value: 4, label: 'Significant',    sub: 'Clear, visible improvement'              },
    { value: 5, label: 'Dramatic',       sub: 'Remarkable change in my skin'            },
]

const CHANGES_OPTIONS = [
    { id: 'new_medication',            label: 'Started a new medication'              },
    { id: 'pregnant_breastfeeding',    label: 'Pregnant or breastfeeding'             },
    { id: 'moved_city',                label: 'Moved to a different city or climate'  },
    { id: 'changed_products',          label: 'Changed other skincare products'       },
    { id: 'nothing_significant',       label: 'Nothing significant'                   },
]

export default function CheckinPage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', color: '#888' }}>Loading…</div>}>
            <CheckinContent />
        </Suspense>
    )
}

function CheckinContent() {
    const searchParams  = useSearchParams()
    const weekParam     = parseInt(searchParams.get('week') ?? '4')
    const week          = [2, 4, 8].includes(weekParam) ? weekParam : 4

    const [step,            setStep]            = useState(1)
    const [score,           setScore]           = useState<number | null>(null)
    const [hasReaction,     setHasReaction]     = useState<boolean | null>(null)
    const [reactionDetail,  setReactionDetail]  = useState('')
    const [changes,         setChanges]         = useState<string[]>([])
    const [movedCity,       setMovedCity]       = useState(false)
    const [newCity,         setNewCity]         = useState('')
    const [newCountry,      setNewCountry]      = useState('')
    const [photoFile,       setPhotoFile]       = useState<File | null>(null)
    const [photoPreview,    setPhotoPreview]    = useState<string | null>(null)
    const [submitting,      setSubmitting]      = useState(false)
    const [result,          setResult]          = useState<{ score: number; orderReleased: boolean } | null>(null)
    const [error,           setError]           = useState('')

    const fileRef = useRef<HTMLInputElement>(null)

    const toggleChange = (id: string) => {
        if (id === 'nothing_significant') {
            setChanges(['nothing_significant'])
            setMovedCity(false)
            return
        }
        setChanges(prev =>
            prev.includes(id)
                ? prev.filter(c => c !== id)
                : [...prev.filter(c => c !== 'nothing_significant'), id]
        )
        if (id === 'moved_city') setMovedCity(v => !v)
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    const handleSubmit = async () => {
        if (!score) return
        setSubmitting(true)
        setError('')

        try {
            // Upload photo first if present
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

            const res = await fetch('/api/checkin/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    week,
                    score,
                    adverse_reactions: hasReaction ?? false,
                    adverse_detail: reactionDetail,
                    changes_since_last: changes,
                    moved_city: movedCity,
                    new_city: movedCity ? newCity : null,
                    new_country: movedCity ? newCountry : null,
                    photo_url,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Check-in failed')

            // Signal to dashboard that a check-in was just completed
            sessionStorage.setItem('toneek_checkin_complete', String(week))

            setResult({
                score: score * 2,
                orderReleased: data.order_released ?? false,
            })
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Result screen ─────────────────────────────────────────────────────────
    if (result) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="bg-white dark:bg-[#1a1a1a] border border-green-500/50 dark:border-green-500 rounded-xl p-8 text-center shadow-sm">
                    <p className="text-5xl mb-2">✅</p>
                    <h2 className="text-green-600 dark:text-green-500 text-xl font-bold mb-2">
                        Week {week} check-in complete
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        Your score: <strong className="text-gray-900 dark:text-gray-100">{result.score}/10</strong>
                    </p>
                    {result.orderReleased && (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg py-3 px-4 mb-4">
                            <p className="text-green-700 dark:text-green-400 text-sm font-bold">
                                📦 Your next order has been queued for dispatch
                            </p>
                        </div>
                    )}
                    <a href="/dashboard/formula" className="inline-block px-6 py-3 bg-toneek-amber text-[#000000] rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                        View my formula →
                    </a>
                </div>
            </div>
        )
    }

    // ── Step indicator ────────────────────────────────────────────────────────
    const TOTAL_STEPS = 4

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Header */}
            <div className="bg-white dark:bg-[#261B18] pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 dark:border-[#3A2820] -mt-8 sm:-mt-8 mx-[-1rem] sm:mx-[-2rem] mb-2 relative pb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Week {week} Check-in</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Step {step} of {TOTAL_STEPS}</p>
            </div>

            {/* Progress bar */}
            <div className="bg-gray-200 dark:bg-[#1a1a1a] rounded-sm h-1 overflow-hidden">
                <div className="bg-toneek-amber h-full transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
            </div>

            {/* ── Step 1: Improvement score ── */}
            {step === 1 && (
                <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                    <p className="text-gray-800 dark:text-gray-200 font-bold text-base mb-4">
                        How is your skin compared to when you started?
                    </p>
                    <div className="flex flex-col gap-2">
                        {SCORE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                id={`score-${opt.value}`}
                                onClick={() => setScore(opt.value)}
                                className={`text-left w-full flex justify-between items-center rounded-lg p-3.5 transition-all outline-none border-2 ${
                                    score === opt.value
                                        ? 'bg-toneek-amber/10 border-toneek-amber'
                                        : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                <div>
                                    <p className={`font-bold text-sm mb-0.5 ${score === opt.value ? 'text-toneek-amber' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {opt.value}. {opt.label}
                                    </p>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs">{opt.sub}</p>
                                </div>
                                {score === opt.value && <span className="text-toneek-amber text-lg">●</span>}
                            </button>
                        ))}
                    </div>
                    <button
                        id="step1-next"
                        onClick={() => setStep(2)}
                        disabled={!score}
                        className={`w-full mt-6 py-3 rounded-lg font-bold text-sm transition-all ${
                            score ? 'bg-toneek-amber text-[#000000] cursor-pointer hover:opacity-90' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                        }`}
                    >
                        Continue
                    </button>
                </section>
            )}

            {/* ── Step 2: Adverse reactions ── */}
            {step === 2 && (
                <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                    <p className="text-gray-800 dark:text-gray-200 font-bold text-base mb-4">
                        Any burning, peeling, or unusual reactions?
                    </p>
                    <div className="flex gap-3 mb-4">
                        {[{ v: true, label: 'Yes' }, { v: false, label: 'No' }].map(({ v, label }) => (
                            <button
                                key={label}
                                id={`reaction-${label.toLowerCase()}`}
                                onClick={() => setHasReaction(v)}
                                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all outline-none border-2 ${
                                    hasReaction === v
                                        ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                        : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {hasReaction === true && (
                        <div className="mb-4">
                            <label className="block text-gray-500 dark:text-gray-400 text-xs font-medium mb-1.5 mt-2">
                                Tell us what you noticed
                            </label>
                            <textarea
                                id="reaction-detail"
                                value={reactionDetail}
                                onChange={e => setReactionDetail(e.target.value)}
                                placeholder="e.g. slight redness on cheeks for 2 days after application..."
                                rows={3}
                                className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm outline-none resize-y focus:border-toneek-amber dark:focus:border-toneek-amber transition-colors"
                            />
                        </div>
                    )}
                    <div className="flex gap-3 mt-2">
                        <button onClick={() => setStep(1)} className="flex-1 py-3 bg-transparent border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors">Back</button>
                        <button
                            id="step2-next"
                            onClick={() => setStep(3)}
                            disabled={hasReaction === null}
                            className={`flex-[2] py-3 rounded-lg font-bold text-sm transition-all ${
                                hasReaction !== null ? 'bg-toneek-amber text-[#000000] cursor-pointer hover:opacity-90' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                            }`}
                        >
                            Continue
                        </button>
                    </div>
                </section>
            )}

            {/* ── Step 3: Changes since last ── */}
            {step === 3 && (
                <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                    <p className="text-gray-800 dark:text-gray-200 font-bold text-base mb-1">
                        Has anything changed since your last check-in?
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">Select all that apply</p>
                    <div className="flex flex-col gap-2 mb-4">
                        {CHANGES_OPTIONS.map(opt => {
                            const active = changes.includes(opt.id)
                            return (
                                <button
                                    key={opt.id}
                                    id={`change-${opt.id}`}
                                    onClick={() => toggleChange(opt.id)}
                                    className={`text-left w-full rounded-lg p-3 text-sm font-medium transition-all outline-none border-2 ${
                                        active
                                            ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                            : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>
                    {movedCity && (
                        <div className="flex flex-col gap-2 mb-4 bg-toneek-amber/5 border border-toneek-amber/20 p-4 rounded-lg">
                            <p className="text-toneek-amber text-xs font-bold mb-1">Where did you move to?</p>
                            <input placeholder="New city" value={newCity} onChange={e => setNewCity(e.target.value)}
                                className="w-full bg-white dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-toneek-amber transition-colors" />
                            <input placeholder="New country" value={newCountry} onChange={e => setNewCountry(e.target.value)}
                                className="w-full bg-white dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-md px-3 py-2 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-toneek-amber transition-colors" />
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className="flex-1 py-3 bg-transparent border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors">Back</button>
                        <button
                            id="step3-next"
                            onClick={() => setStep(4)}
                            disabled={changes.length === 0}
                            className={`flex-[2] py-3 rounded-lg font-bold text-sm transition-all ${
                                changes.length > 0 ? 'bg-toneek-amber text-[#000000] cursor-pointer hover:opacity-90' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                            }`}
                        >
                            Continue
                        </button>
                    </div>
                </section>
            )}

            {/* ── Step 4: Photo upload ── */}
            {step === 4 && (
                <section className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 shadow-sm">
                    <p className="text-gray-800 dark:text-gray-200 font-bold text-base mb-1">
                        Upload a progress photo <span className="text-gray-500 font-normal">(optional)</span>
                    </p>
                    {(week === 4 || week === 8) && (
                        <div className="bg-toneek-amber/10 border border-toneek-amber/20 rounded-lg p-3 my-4">
                            <p className="text-toneek-amber text-xs">
                                📸 Photos help us recalculate your Skin OS Score accurately at Week {week}.
                            </p>
                        </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="photo-upload-input" />
                    {photoPreview ? (
                        <div className="mb-4 text-center">
                            <img src={photoPreview} alt="Preview" className="w-full max-h-[200px] object-cover rounded-lg border border-gray-200 dark:border-[#2a2a2a]" />
                            <button onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                                className="mt-2 bg-transparent border-none text-red-500 text-xs font-semibold cursor-pointer hover:underline">
                                Remove photo
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => fileRef.current?.click()}
                            className="w-full py-10 bg-gray-50 flex items-center justify-center dark:bg-[#222] border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-xl text-gray-500 text-sm font-medium cursor-pointer mb-4 mt-4 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]/50 transition-colors">
                            + Tap to upload a photo
                        </button>
                    )}
                    {error && (
                        <p className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
                            {error}
                        </p>
                    )}
                    <div className="flex gap-3 mt-2">
                        <button onClick={() => setStep(3)} className="flex-1 py-3 bg-transparent border border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors">Back</button>
                        <button
                            id="submit-checkin"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={`flex-[2] py-3 rounded-lg font-bold text-sm transition-all ${
                                !submitting ? 'bg-toneek-amber text-[#000000] cursor-pointer hover:opacity-90' : 'bg-toneek-amber/50 text-[#000000] cursor-not-allowed'
                            }`}
                        >
                            {submitting ? 'Submitting…' : 'Submit check-in'}
                        </button>
                    </div>
                    <p className="text-gray-500 text-xs text-center mt-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                        onClick={handleSubmit}>
                        Skip photo and submit →
                    </p>
                </section>
            )}
        </div>
    )
}
