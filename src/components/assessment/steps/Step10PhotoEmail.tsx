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
    const { 
        full_name, phone, whatsapp, email, 
        how_did_you_hear, photo_consent, 
        setField, prevStep 
    } = store
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const canSubmit = 
        full_name.trim().length >= 2 && 
        phone.trim().length >= 5 && 
        whatsapp.trim().length >= 5 && 
        email && email.includes('@') && 
        how_did_you_hear

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
            // Step 10
            full_name: store.full_name,
            phone: store.phone,
            whatsapp: store.whatsapp,
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
        <div className="w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-6">Almost done — your contact details</h2>

            <div className="flex flex-col gap-4 mb-6">
                {/* Full Name */}
                <div>
                    <label htmlFor="full_name" className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">Full name</label>
                    <input
                        id="full_name"
                        type="text"
                        value={full_name}
                        onChange={e => setField('full_name', e.target.value)}
                        placeholder="Kemi Adebayo"
                        className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-toneek-amber transition-colors"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">Your email address</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setField('email', e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-toneek-amber transition-colors"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mobile Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">Mobile number</label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={e => setField('phone', e.target.value)}
                            placeholder="0800 000 0000"
                            className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-toneek-amber transition-colors"
                        />
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label htmlFor="whatsapp" className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">WhatsApp number</label>
                        <input
                            id="whatsapp"
                            type="tel"
                            value={whatsapp}
                            onChange={e => setField('whatsapp', e.target.value)}
                            placeholder="0800 000 0000"
                            className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-toneek-amber transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Photo — optional, incentivised */}
            {/* Photo — optional, incentivised */}
            <div className="mb-6">
                <label className="block text-gray-900 dark:text-gray-100 font-bold mb-1 text-sm">
                    Add a photo of your skin
                    <span className="ml-2 inline-block bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-gray-200 dark:border-[#333]">Optional</span>
                </label>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">
                    A photo helps us personalise your formula rationale and improves your confidence score.
                    It is stored securely and never shared.
                </p>
                <label htmlFor="photo-upload" className="w-full bg-gray-50 dark:bg-[#222] border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-lg p-6 text-center text-gray-500 dark:text-gray-400 cursor-pointer hover:border-toneek-amber dark:hover:border-toneek-amber hover:text-gray-900 dark:hover:text-gray-100 transition-colors block text-sm font-medium">
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
                    <label className="mt-3 flex items-start gap-2 p-3 text-sm rounded-lg bg-toneek-amber/10 border-2 border-toneek-amber text-toneek-amber cursor-pointer">
                        <input
                            type="checkbox"
                            checked={photo_consent}
                            onChange={e => setField('photo_consent', e.target.checked)}
                            className="mt-0.5"
                        />
                        <span className="font-medium">I consent to Toneek storing my photo for formula personalisation</span>
                    </label>
                )}
            </div>

            {/* How did you hear */}
            {/* How did you hear */}
            <div className="mb-6 border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
                <label className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">How did you hear about Toneek?</label>
                <div className="grid grid-cols-2 gap-2">
                    {HOW_DID_YOU_HEAR_OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            id={`heard-${opt.id}`}
                            className={`text-left w-full p-3 rounded-lg border-2 transition-all font-medium text-xs outline-none ${
                                how_did_you_hear === opt.id
                                    ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                    : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => setField('how_did_you_hear', opt.id)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm mt-4 mb-2">{error}</p>}

            <div className="flex gap-3 mt-8">
                <button id="step10-back" className="w-[100px] py-3 rounded-lg font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors disabled:opacity-50" onClick={prevStep} disabled={submitting}>Back</button>
                <button
                    id="step10-submit"
                    className="flex-1 py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? 'Building your formula…' : 'Get my formula'}
                </button>
            </div>
        </div>
    )
}
