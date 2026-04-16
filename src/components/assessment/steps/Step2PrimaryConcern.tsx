'use client'
// steps/Step2PrimaryConcern.tsx
// IMPORTANT: This is Step 2 — before skin type. The concern leads.

import { useAssessmentStore } from '@/store/assessmentStore'

const CONCERNS = [
    { id: 'PIH', label: 'Dark spots', description: 'Marks left by breakouts, irritation, or scars', icon: '🔵' },
    { id: 'acne', label: 'Active breakouts', description: 'Pimples, cysts, or persistent spots', icon: '🔴' },
    { id: 'tone', label: 'Uneven skin tone', description: 'Patchy colour, not uniform complexion', icon: '🟤' },
    { id: 'dryness', label: 'Dry or tight skin', description: 'Feels tight, rough, or flaky', icon: '💧' },
    { id: 'oiliness', label: 'Oily or shiny skin', description: 'Shiny all over, congested pores', icon: '✨' },
    { id: 'texture', label: 'Rough texture', description: 'Bumpy, uneven, or dull surface', icon: '🔶' },
    { id: 'sensitivity', label: 'Sensitive or irritated', description: 'Reacts easily, often red or uncomfortable', icon: '🌸' },
    { id: 'razor_bumps', label: 'Razor bumps', description: 'Bumps and dark spots from shaving', icon: '🪒' },
    { id: 'ageing', label: 'Signs of ageing', description: 'Fine lines, loss of firmness, dull skin', icon: '⏳' },
]

export default function Step2PrimaryConcern() {
    const { primary_concern, setField, nextStep, prevStep } = useAssessmentStore()

    return (
        <div className="step step-2">
            <h2 className="step-title">What is your main skin concern right now?</h2>
            <p className="step-subtitle">Choose the one that bothers you most. You can add others on the next step.</p>

            <div className="card-grid">
                {CONCERNS.map(concern => (
                    <button
                        key={concern.id}
                        id={`concern-${concern.id}`}
                        className={`card ${primary_concern === concern.id ? 'card-selected' : ''}`}
                        onClick={() => setField('primary_concern', concern.id)}
                    >
                        <span className="card-icon">{concern.icon}</span>
                        <span className="card-label">{concern.label}</span>
                        <span className="card-desc">{concern.description}</span>
                    </button>
                ))}
            </div>

            <div className="step-nav">
                <button id="step2-back" className="btn-secondary" onClick={prevStep}>Back</button>
                <button id="step2-next" className="btn-primary" disabled={!primary_concern} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
