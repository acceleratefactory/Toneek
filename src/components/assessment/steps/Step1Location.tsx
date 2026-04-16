'use client'
// steps/Step1Location.tsx
// Collects country, city, years in location, climate transition effects.
// Auto-resolves climate zone from city via API. Falls back to 6 profile cards.

import { useState } from 'react'
import { useAssessmentStore } from '@/store/assessmentStore'

const CLIMATE_PROFILES = [
    { id: 'humid_tropical', label: 'Hot and humid all year', description: 'Like Lagos, Accra, Miami, Kingston', icon: '🌴' },
    { id: 'semi_arid', label: 'Hot and dry', description: 'Like Abuja, Dubai, Johannesburg (dry season)', icon: '☀️' },
    { id: 'temperate_maritime', label: 'Mild and damp, central heating in winter', description: 'Like London, Amsterdam, Dublin', icon: '🌧️' },
    { id: 'cold_continental', label: 'Cold winters, humid summers', description: 'Like New York, Chicago, Toronto', icon: '❄️' },
    { id: 'mediterranean', label: 'Hot dry summers, mild wet winters', description: 'Like Cape Town, Los Angeles, Sydney', icon: '⛅' },
    { id: 'equatorial', label: 'Extremely hot and humid all year', description: 'Like Douala, Kinshasa, Freetown', icon: '🌿' },
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
        <div className="step step-1">
            <h2 className="step-title">Where do you currently live?</h2>
            <p className="step-subtitle">Your climate directly affects your skin and shapes your formula.</p>

            <div className="field-group">
                <label htmlFor="country">Country</label>
                <input
                    id="country"
                    type="text"
                    value={country_of_residence}
                    onChange={e => setField('country_of_residence', e.target.value)}
                    placeholder="e.g. Nigeria, United Kingdom"
                    className="text-input"
                />
            </div>

            <div className="field-group">
                <label htmlFor="city">City</label>
                <input
                    id="city"
                    type="text"
                    value={city_of_residence}
                    onChange={e => setField('city_of_residence', e.target.value)}
                    onBlur={handleCityBlur}
                    placeholder="e.g. Lagos, London"
                    className="text-input"
                />
                {resolving && <span className="hint">Resolving climate zone…</span>}
                {climate_zone && !resolving && (
                    <span className="hint success">Climate zone detected ✓</span>
                )}
            </div>

            {cityNotFound && (
                <div className="climate-manual">
                    <p className="step-subtitle">We could not find your city. Which best describes your climate?</p>
                    <div className="card-grid">
                        {CLIMATE_PROFILES.map(profile => (
                            <button
                                key={profile.id}
                                id={`climate-${profile.id}`}
                                className={`card ${climate_zone === profile.id ? 'card-selected' : ''}`}
                                onClick={() => setField('climate_zone', profile.id)}
                            >
                                <span className="card-icon">{profile.icon}</span>
                                <span className="card-label">{profile.label}</span>
                                <span className="card-desc">{profile.description}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="field-group">
                <label>How long have you lived there?</label>
                <div className="option-list">
                    {YEARS_OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            id={`years-${opt.id}`}
                            className={`option-btn ${years_in_current_location === opt.id ? 'option-selected' : ''}`}
                            onClick={() => setField('years_in_current_location', opt.id)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {showDiasporaQuestions && (
                <div className="field-group">
                    <label>Have you noticed any of these since moving? Select all that apply.</label>
                    <div className="option-list">
                        {TRANSITION_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                id={`transition-${opt.id}`}
                                className={`option-btn ${(climate_transition_effects as string[]).includes(opt.id) ? 'option-selected' : ''}`}
                                onClick={() => toggleTransitionEffect(opt.id)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                id="step1-next"
                className="btn-primary"
                disabled={!canProceed}
                onClick={nextStep}
            >
                Continue
            </button>
        </div>
    )
}
