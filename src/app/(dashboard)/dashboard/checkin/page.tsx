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
                <div style={{ background: '#1a1a1a', border: '1px solid #4caf82', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</p>
                    <h2 style={{ color: '#4caf82', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Week {week} check-in complete
                    </h2>
                    <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: '1rem' }}>
                        Your score: <strong style={{ color: '#f5f5f5' }}>{result.score}/10</strong>
                    </p>
                    {result.orderReleased && (
                        <div style={{ background: 'rgba(76,175,130,0.08)', border: '1px solid rgba(76,175,130,0.3)', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                            <p style={{ color: '#4caf82', fontSize: '0.88rem', fontWeight: 600 }}>
                                📦 Your next order has been queued for dispatch
                            </p>
                        </div>
                    )}
                    <a href="/dashboard/formula" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#d4a574', color: '#0f0f0f', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
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
            <div style={{ background: '#1a1a1a', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                <div style={{ background: '#d4a574', height: '100%', width: `${(step / TOTAL_STEPS) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>

            {/* ── Step 1: Improvement score ── */}
            {step === 1 && (
                <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                    <p style={{ color: '#ccc', fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>
                        How is your skin compared to when you started?
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {SCORE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                id={`score-${opt.value}`}
                                onClick={() => setScore(opt.value)}
                                style={{
                                    background: score === opt.value ? 'rgba(212,165,116,0.12)' : '#222',
                                    border: `1.5px solid ${score === opt.value ? '#d4a574' : '#2a2a2a'}`,
                                    borderRadius: '10px',
                                    padding: '0.85rem 1rem',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <div>
                                    <p style={{ color: score === opt.value ? '#d4a574' : '#f5f5f5', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.15rem' }}>
                                        {opt.value}. {opt.label}
                                    </p>
                                    <p style={{ color: '#666', fontSize: '0.78rem' }}>{opt.sub}</p>
                                </div>
                                {score === opt.value && <span style={{ color: '#d4a574', fontSize: '1.1rem' }}>●</span>}
                            </button>
                        ))}
                    </div>
                    <button
                        id="step1-next"
                        onClick={() => setStep(2)}
                        disabled={!score}
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '1.25rem', opacity: !score ? 0.5 : 1 }}
                    >
                        Continue
                    </button>
                </section>
            )}

            {/* ── Step 2: Adverse reactions ── */}
            {step === 2 && (
                <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                    <p style={{ color: '#ccc', fontWeight: 600, fontSize: '1rem', marginBottom: '1rem' }}>
                        Any burning, peeling, or unusual reactions?
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[{ v: true, label: 'Yes' }, { v: false, label: 'No' }].map(({ v, label }) => (
                            <button
                                key={label}
                                id={`reaction-${label.toLowerCase()}`}
                                onClick={() => setHasReaction(v)}
                                style={{
                                    flex: 1, padding: '0.85rem',
                                    background: hasReaction === v ? 'rgba(212,165,116,0.12)' : '#222',
                                    border: `1.5px solid ${hasReaction === v ? '#d4a574' : '#2a2a2a'}`,
                                    borderRadius: '10px',
                                    color: hasReaction === v ? '#d4a574' : '#f5f5f5',
                                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {hasReaction === true && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ color: '#888', fontSize: '0.82rem', display: 'block', marginBottom: '0.4rem' }}>
                                Tell us what you noticed
                            </label>
                            <textarea
                                id="reaction-detail"
                                value={reactionDetail}
                                onChange={e => setReactionDetail(e.target.value)}
                                placeholder="e.g. slight redness on cheeks for 2 days after application..."
                                rows={3}
                                style={{ width: '100%', background: '#222', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0.7rem', color: '#f5f5f5', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button onClick={() => setStep(1)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', cursor: 'pointer' }}>Back</button>
                        <button
                            id="step2-next"
                            onClick={() => setStep(3)}
                            disabled={hasReaction === null}
                            className="btn-primary"
                            style={{ flex: 2, opacity: hasReaction === null ? 0.5 : 1 }}
                        >
                            Continue
                        </button>
                    </div>
                </section>
            )}

            {/* ── Step 3: Changes since last ── */}
            {step === 3 && (
                <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                    <p style={{ color: '#ccc', fontWeight: 600, fontSize: '1rem', marginBottom: '0.4rem' }}>
                        Has anything changed since your last check-in?
                    </p>
                    <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '1rem' }}>Select all that apply</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {CHANGES_OPTIONS.map(opt => {
                            const active = changes.includes(opt.id)
                            return (
                                <button
                                    key={opt.id}
                                    id={`change-${opt.id}`}
                                    onClick={() => toggleChange(opt.id)}
                                    style={{
                                        padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer',
                                        background: active ? 'rgba(212,165,116,0.1)' : '#222',
                                        border: `1.5px solid ${active ? '#d4a574' : '#2a2a2a'}`,
                                        borderRadius: '8px', color: active ? '#d4a574' : '#ccc',
                                        fontSize: '0.88rem', transition: 'all 0.15s',
                                    }}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>
                    {movedCity && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                            <p style={{ color: '#d4a574', fontSize: '0.82rem', fontWeight: 600 }}>Where did you move to?</p>
                            <input placeholder="New city" value={newCity} onChange={e => setNewCity(e.target.value)}
                                style={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#f5f5f5', fontSize: '0.88rem' }} />
                            <input placeholder="New country" value={newCountry} onChange={e => setNewCountry(e.target.value)}
                                style={{ background: '#222', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#f5f5f5', fontSize: '0.88rem' }} />
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setStep(2)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', cursor: 'pointer' }}>Back</button>
                        <button
                            id="step3-next"
                            onClick={() => setStep(4)}
                            disabled={changes.length === 0}
                            className="btn-primary"
                            style={{ flex: 2, opacity: changes.length === 0 ? 0.5 : 1 }}
                        >
                            Continue
                        </button>
                    </div>
                </section>
            )}

            {/* ── Step 4: Photo upload ── */}
            {step === 4 && (
                <section style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                    <p style={{ color: '#ccc', fontWeight: 600, fontSize: '1rem', marginBottom: '0.4rem' }}>
                        Upload a progress photo <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span>
                    </p>
                    {(week === 4 || week === 8) && (
                        <div style={{ background: 'rgba(212,165,116,0.06)', border: '1px solid rgba(212,165,116,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                            <p style={{ color: '#d4a574', fontSize: '0.82rem' }}>
                                📸 Photos help us recalculate your Skin OS Score accurately at Week {week}.
                            </p>
                        </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange}
                        style={{ display: 'none' }} id="photo-upload-input" />
                    {photoPreview ? (
                        <div style={{ marginBottom: '1rem' }}>
                            <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #2a2a2a' }} />
                            <button onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                                style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.82rem' }}>
                                Remove photo
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => fileRef.current?.click()}
                            style={{ width: '100%', padding: '1.5rem', background: '#222', border: '2px dashed #2a2a2a', borderRadius: '10px', color: '#666', cursor: 'pointer', fontSize: '0.88rem', marginBottom: '1rem' }}>
                            + Tap to upload a photo
                        </button>
                    )}
                    {error && (
                        <p style={{ color: '#e05555', fontSize: '0.82rem', marginBottom: '0.75rem', background: 'rgba(224,85,85,0.08)', borderRadius: '6px', padding: '0.6rem 0.8rem' }}>
                            {error}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setStep(3)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', cursor: 'pointer' }}>Back</button>
                        <button
                            id="submit-checkin"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="btn-primary"
                            style={{ flex: 2, opacity: submitting ? 0.6 : 1 }}
                        >
                            {submitting ? 'Submitting…' : 'Submit check-in'}
                        </button>
                    </div>
                    <p style={{ color: '#555', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem', cursor: 'pointer' }}
                        onClick={handleSubmit}>
                        Skip photo and submit →
                    </p>
                </section>
            )}
        </div>
    )
}
