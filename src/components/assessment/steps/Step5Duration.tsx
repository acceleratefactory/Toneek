'use client'
// steps/Step5Duration.tsx
// Question A: how long has the concern existed.
// Question B: trajectory — appears after A is answered.

import { useAssessmentStore } from '@/store/assessmentStore'

const DURATIONS = [
    { id: 'less_than_1_month', label: 'Less than 1 month', description: 'This is relatively new' },
    { id: '1_to_6_months', label: '1–6 months', description: 'A few months now' },
    { id: '6_to_12_months', label: '6–12 months', description: 'About a year' },
    { id: 'more_than_1_year', label: 'More than 1 year', description: 'This has been ongoing for a while' },
]

const TRAJECTORIES = [
    { id: 'improving', label: 'Getting better on its own' },
    { id: 'staying_the_same', label: 'Staying about the same' },
    { id: 'getting_worse', label: 'Getting worse over time' },
]

export default function Step5Duration() {
    const { concern_duration, concern_trajectory, setField, nextStep, prevStep } = useAssessmentStore()

    const canProceed = concern_duration && concern_trajectory

    return (
        <div className="step step-5">
            <h2 className="step-title">How long have you had this concern?</h2>

            <div className="option-list">
                {DURATIONS.map(d => (
                    <button
                        key={d.id}
                        id={`duration-${d.id}`}
                        className={`option-btn option-btn-large ${concern_duration === d.id ? 'option-selected' : ''}`}
                        onClick={() => setField('concern_duration', d.id)}
                    >
                        <span className="option-label">{d.label}</span>
                        <span className="option-desc">{d.description}</span>
                    </button>
                ))}
            </div>

            {concern_duration && (
                <>
                    <h2 className="step-title" style={{ marginTop: '2rem' }}>And over that time, has it been…</h2>
                    <div className="option-list">
                        {TRAJECTORIES.map(t => (
                            <button
                                key={t.id}
                                id={`trajectory-${t.id}`}
                                className={`option-btn ${concern_trajectory === t.id ? 'option-selected' : ''}`}
                                onClick={() => setField('concern_trajectory', t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </>
            )}

            <div className="step-nav">
                <button id="step5-back" className="btn-secondary" onClick={prevStep}>Back</button>
                <button id="step5-next" className="btn-primary" disabled={!canProceed} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
