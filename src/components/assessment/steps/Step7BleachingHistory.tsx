'use client'
// steps/Step7BleachingHistory.tsx
// Non-judgmental framing. Conditional follow-up if any history except 'none'.

import { useAssessmentStore } from '@/store/assessmentStore'

const BLEACHING_OPTIONS = [
    { id: 'none', label: 'I have never used skin-lightening products' },
    { id: 'historical', label: 'I used them in the past but stopped more than 1 year ago' },
    { id: 'recent_12mo', label: 'I used them but stopped in the last year' },
    { id: 'active', label: 'I currently use them' },
    { id: 'unsure', label: 'I am not sure — some products I used may have contained lightening ingredients' },
]

const CESSATION_EFFECTS = [
    { id: 'barrier_sensitive', label: 'My skin has become more sensitive or reactive' },
    { id: 'rebound_darkening', label: 'My skin has gotten darker since stopping' },
    { id: 'no_change', label: 'No noticeable change' },
    { id: 'still_using_occasionally', label: 'I have stopped but still use occasionally' },
]

export default function Step7BleachingHistory() {
    const { bleaching_history, bleaching_cessation_effects, setField, nextStep, prevStep } = useAssessmentStore()
    const selected_effects = bleaching_cessation_effects as string[]
    const showFollowUp = bleaching_history && bleaching_history !== 'none'

    const toggleEffect = (id: string) => {
        if (selected_effects.includes(id)) {
            setField('bleaching_cessation_effects', selected_effects.filter(e => e !== id))
        } else {
            setField('bleaching_cessation_effects', [...selected_effects, id])
        }
    }

    const canProceed = bleaching_history && (!showFollowUp || selected_effects.length > 0)

    return (
        <div className="step step-7">
            <h2 className="step-title">Have you ever used skin-lightening or toning products?</h2>
            <p className="step-subtitle">
                We ask this because it helps us understand your skin's current state.
                There is no judgment — many products sold as 'lightening' or 'toning' can affect how your skin responds to treatment.
            </p>

            <div className="option-list">
                {BLEACHING_OPTIONS.map(opt => (
                    <button
                        key={opt.id}
                        id={`bleaching-${opt.id}`}
                        className={`option-btn ${bleaching_history === opt.id ? 'option-selected' : ''}`}
                        onClick={() => {
                            setField('bleaching_history', opt.id)
                            if (opt.id === 'none') setField('bleaching_cessation_effects', [])
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {showFollowUp && (
                <div className="follow-up">
                    <h3 className="step-subtitle" style={{ fontWeight: 600, marginTop: '1.5rem' }}>
                        Have you noticed any of these since stopping? Select all that apply.
                    </h3>
                    <div className="option-list">
                        {CESSATION_EFFECTS.map(effect => (
                            <button
                                key={effect.id}
                                id={`cessation-${effect.id}`}
                                className={`option-btn ${selected_effects.includes(effect.id) ? 'option-selected' : ''}`}
                                onClick={() => toggleEffect(effect.id)}
                            >
                                {effect.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="step-nav">
                <button id="step7-back" className="btn-secondary" onClick={prevStep}>Back</button>
                <button id="step7-next" className="btn-primary" disabled={!canProceed} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
