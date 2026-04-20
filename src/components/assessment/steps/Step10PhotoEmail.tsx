'use client'
// steps/Step10PhotoEmail.tsx
// Photo optional (incentivised). Email required. How did you hear. SUBMIT.

import { useState } from 'react'
import { useAssessmentStore } from '@/store/assessmentStore'
import { useRouter } from 'next/navigation'

const HOW_DID_YOU_HEAR_OPTIONS = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'friend_referral', label: 'A friend told me' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'google', label: 'Google search' },
    { id: 'twitter_x', label: 'Twitter / X' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'other', label: 'Other' },
]

export default function Step10PhotoEmail() {
    const store = useAssessmentStore()
    const { email, how_did_you_hear, photo_consent, setField, prevStep } = store
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const canSubmit = email && email.includes('@') && how_did_you_hear

    const handleSubmit = async () => {
        if (!canSubmit) return
        setSubmitting(true)
        setError('')

        // Build full assessment payload from store
        const payload = {
            country_of_residence: store.country_of_residence,
            city_of_residence: store.city_of_residence,
            climate_zone: store.climate_zone,
            years_in_current_location: store.years_in_current_location,
            climate_transition_effects: store.climate_transition_effects,
            primary_concern: store.primary_concern,
            skin_type: store.skin_type,
            secondary_concerns: store.secondary_concerns,
            concern_duration: store.concern_duration,
            concern_trajectory: store.concern_trajectory,
            triggers: store.triggers,
            bleaching_history: store.bleaching_history,
            bleaching_cessation_effects: store.bleaching_cessation_effects,
            pregnant_or_breastfeeding: store.pregnant_or_breastfeeding,
            hormonal_contraception: store.hormonal_contraception,
            medications: store.medications,
            current_product_count: store.current_product_count,
            current_actives: store.current_actives,
            routine_expectation: store.routine_expectation,
            photo_url: store.photo_url,
            photo_consent: store.photo_consent,
            email: store.email,
            how_did_you_hear: store.how_did_you_hear,
            all_steps_complete: true,
        }

        try {
            const res = await fetch('/api/assessments/submit', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' },
            })
            const data = await res.json()
            if (data.success) {
                const id = data.assessment_id
                router.push(id ? `/results?assessment_id=${id}` : '/results')
            } else {
                setError('Something went wrong. Please try again.')
            }
        } catch {
            setError('Could not connect. Please check your connection and try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="step step-10">
            <h2 className="step-title">Almost done — where should we send your formula?</h2>

            {/* Email */}
            <div className="field-group">
                <label htmlFor="email">Your email address</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setField('email', e.target.value)}
                    placeholder="you@example.com"
                    className="text-input"
                />
            </div>

            {/* Photo — optional, incentivised */}
            <div className="field-group photo-optional">
                <label className="question-label">Add a photo of your skin <span className="badge">Optional</span></label>
                <p className="hint">
                    A photo helps us personalise your formula rationale and improves your confidence score.
                    It is stored securely and never shared.
                </p>
                <label htmlFor="photo-upload" className="photo-upload-label">
                    {store.photo_url ? '✓ Photo added' : 'Upload a photo'}
                    <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                            if (e.target.files?.[0]) {
                                setField('photo_consent', true)
                                // photo upload to Supabase Storage handled in submit route
                                setField('photo_url', 'pending_upload')
                            }
                        }}
                    />
                </label>
                {store.photo_url && (
                    <label className="option-btn option-selected" style={{ marginTop: '0.5rem' }}>
                        <input
                            type="checkbox"
                            checked={photo_consent}
                            onChange={e => setField('photo_consent', e.target.checked)}
                            style={{ marginRight: '0.5rem' }}
                        />
                        I consent to Toneek storing my photo for formula personalisation
                    </label>
                )}
            </div>

            {/* How did you hear */}
            <div className="field-group">
                <label className="question-label">How did you hear about Toneek?</label>
                <div className="option-list option-list-compact">
                    {HOW_DID_YOU_HEAR_OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            id={`heard-${opt.id}`}
                            className={`option-btn ${how_did_you_hear === opt.id ? 'option-selected' : ''}`}
                            onClick={() => setField('how_did_you_hear', opt.id)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="step-nav">
                <button id="step10-back" className="btn-secondary" onClick={prevStep} disabled={submitting}>Back</button>
                <button
                    id="step10-submit"
                    className="btn-primary btn-submit"
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? 'Building your formula…' : 'Get my formula'}
                </button>
            </div>
        </div>
    )
}
