'use client'
// steps/Step1Location.tsx
// Collects country, city, years in location, climate transition effects.
// Auto-resolves climate zone from city via API. Falls back to 6 profile cards.

import { useState } from 'react'
import { useAssessmentStore } from '@/store/assessmentStore'

const CLIMATE_PROFILES = [
    { id: 'humid_tropical', label: 'Hot and humid all year', description: 'Like Lagos, Accra, Miami, Kingston' },
    { id: 'semi_arid', label: 'Hot and dry', description: 'Like Abuja, Dubai, Johannesburg (dry season)' },
    { id: 'temperate_maritime', label: 'Mild and damp, central heating in winter', description: 'Like London, Amsterdam, Dublin' },
    { id: 'cold_continental', label: 'Cold winters, humid summers', description: 'Like New York, Chicago, Toronto' },
    { id: 'mediterranean', label: 'Hot dry summers, mild wet winters', description: 'Like Cape Town, Los Angeles, Sydney' },
    { id: 'equatorial', label: 'Extremely hot and humid all year', description: 'Like Douala, Kinshasa, Freetown' },
]

const YEARS_OPTIONS = [
    { id: 'less_than_1', label: 'Less than 1 year' },
    { id: '1_to_3', label: '1–3 years' },
    { id: '3_to_10', label: '3–10 years' },
    { id: 'more_than_10', label: 'More than 10 years' },
    { id: 'born_here', label: 'I was born here' },
]

const TRANSITION_OPTIONS = [
    { id: 'more_dry', label: 'My skin has become drier' },
    { id: 'more_oily', label: 'My skin has become oilier' },
    { id: 'more_sensitive', label: 'My skin has become more sensitive' },
    { id: 'more_breakouts', label: 'I am getting more breakouts' },
    { id: 'no_change', label: 'My skin has not changed much' },
]

export default function Step1Location() {
    const { country_of_residence, city_of_residence, climate_zone, years_in_current_location, climate_transition_effects, setField, nextStep } = useAssessmentStore()
    const [resolving, setResolving] = useState(false)
    const [cityNotFound, setCityNotFound] = useState(false)
    const showDiasporaQuestions = years_in_current_location && years_in_current_location !== 'born_here' && years_in_current_location !== 'more_than_10'

    const handleCityBlur = async () => {
        if (!city_of_residence || !country_of_residence) return
        setResolving(true)
        try {
            const res = await fetch(`/api/resolve-climate?city=${encodeURIComponent(city_of_residence)}&country=${encodeURIComponent(country_of_residence)}`)
            const data = await res.json()
            if (data.climate_zone) {
                setField('climate_zone', data.climate_zone)
                setCityNotFound(false)
            } else {
                setCityNotFound(true)
            }
        } catch {
            setCityNotFound(true)
        } finally {
            setResolving(false)
        }
    }

    const toggleTransitionEffect = (id: string) => {
        const current = climate_transition_effects as string[]
        if (current.includes(id)) {
            setField('climate_transition_effects', current.filter(e => e !== id))
        } else {
            setField('climate_transition_effects', [...current, id])
        }
    }

    const canProceed = country_of_residence && city_of_residence && climate_zone && years_in_current_location

    return (
        <div className="w-full max-w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-2">Where do you currently live?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Your climate directly affects your skin and shapes your formula.</p>

            <div className="mb-6">
                <label htmlFor="country" className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">Country</label>
                <input
                    id="country"
                    type="text"
                    value={country_of_residence}
                    onChange={e => setField('country_of_residence', e.target.value)}
                    placeholder="e.g. Nigeria, United Kingdom"
                    className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-toneek-amber transition-colors"
                />
            </div>

            <div className="mb-6">
                <label htmlFor="city" className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">City</label>
                <input
                    id="city"
                    type="text"
                    value={city_of_residence}
                    onChange={e => setField('city_of_residence', e.target.value)}
                    onBlur={handleCityBlur}
                    placeholder="e.g. Lagos, London"
                    className="w-full bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-toneek-amber transition-colors"
                />
                {resolving && <span className="block text-gray-400 text-xs mt-2">Resolving climate zone…</span>}
                {climate_zone && !resolving && (
                    <span className="block text-green-600 dark:text-green-500 text-xs mt-2 font-medium">Climate zone detected ✓</span>
                )}
            </div>

            {cityNotFound && (
                <div className="mb-6">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">We could not find your city. Which best describes your climate?</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {CLIMATE_PROFILES.map(profile => (
                            <button
                                key={profile.id}
                                id={`climate-${profile.id}`}
                                className={`text-left w-full p-4 rounded-xl border-2 transition-all outline-none flex flex-col gap-1 ${
                                    climate_zone === profile.id
                                        ? 'bg-toneek-amber/10 border-toneek-amber'
                                        : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => setField('climate_zone', profile.id)}
                            >
                                <span className={`font-bold text-sm ${climate_zone === profile.id ? 'text-toneek-amber' : 'text-gray-900 dark:text-gray-100'}`}>{profile.label}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{profile.description}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-6">
                <label className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">How long have you lived there?</label>
                <div className="flex flex-col gap-2">
                    {YEARS_OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            id={`years-${opt.id}`}
                            className={`text-left w-full p-3.5 rounded-lg border-2 transition-all font-medium text-sm outline-none ${
                                years_in_current_location === opt.id
                                    ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                    : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => setField('years_in_current_location', opt.id)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {showDiasporaQuestions && (
                <div className="mb-6">
                    <label className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">Have you noticed any of these since moving? Select all that apply.</label>
                    <div className="flex flex-col gap-2">
                        {TRANSITION_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                id={`transition-${opt.id}`}
                                className={`text-left w-full p-3.5 rounded-lg border-2 transition-all font-medium text-sm outline-none ${
                                    (climate_transition_effects as string[]).includes(opt.id)
                                        ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                        : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => toggleTransitionEffect(opt.id)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-8">
                <button
                    id="step1-next"
                    className="w-full py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!canProceed}
                    onClick={nextStep}
                >
                    Continue
                </button>
            </div>
        </div>
    )
}
