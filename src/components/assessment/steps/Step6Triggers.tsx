'use client'
// steps/Step6Triggers.tsx
// Multi-select, no maximum. "I am not sure" option always available.

import { useAssessmentStore } from '@/store/assessmentStore'

const TRIGGERS = [
    { id: 'products_trigger', label: 'Starting or changing skincare products', icon: '🧴' },
    { id: 'weather_trigger', label: 'Weather changes or seasonal shifts', icon: '🌦️' },
    { id: 'stress_trigger', label: 'Stress', icon: '😰' },
    { id: 'hormonal_trigger', label: 'Hormonal changes', description: 'Period, pregnancy, contraception', icon: '🔄' },
    { id: 'diet_trigger', label: 'Diet or eating habits', icon: '🥗' },
    { id: 'unknown_trigger', label: 'I am not sure', icon: '❓' },
]

export default function Step6Triggers() {
    const { triggers, setField, nextStep, prevStep } = useAssessmentStore()
    const selected = triggers as string[]

    const toggle = (id: string) => {
        if (selected.includes(id)) {
            setField('triggers', selected.filter(t => t !== id))
        } else {
            setField('triggers', [...selected, id])
        }
    }

    return (
        <div className="step step-6">
            <h2 className="step-title">What tends to make your skin worse?</h2>
            <p className="step-subtitle">Select all that apply — this helps us understand your skin's patterns.</p>

            <div className="card-grid">
                {TRIGGERS.map(trigger => (
                    <button
                        key={trigger.id}
                        id={`trigger-${trigger.id}`}
                        className={`card ${selected.includes(trigger.id) ? 'card-selected' : ''}`}
                        onClick={() => toggle(trigger.id)}
                    >
                        <span className="card-icon">{trigger.icon}</span>
                        <span className="card-label">{trigger.label}</span>
                        {trigger.description && (
                            <span className="card-desc">{trigger.description}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="step-nav">
                <button id="step6-back" className="btn-secondary" onClick={prevStep}>Back</button>
                <button id="step6-next" className="btn-primary" disabled={selected.length === 0} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
