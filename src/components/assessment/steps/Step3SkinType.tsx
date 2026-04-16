'use client'
// steps/Step3SkinType.tsx
// DO NOT use the words "skin type" in the UI. Reframed as how skin feels by midday.

import { useAssessmentStore } from '@/store/assessmentStore'

const SKIN_TYPES = [
    { id: 'oily', label: 'Shiny all over', description: 'Looks and feels oily everywhere by midday' },
    { id: 'combination', label: 'Shiny in the centre only', description: 'Oily forehead and nose, comfortable on cheeks' },
    { id: 'normal', label: 'Comfortable — not shiny, not tight', description: 'Neither too oily nor too dry' },
    { id: 'dry', label: 'Tight, rough, or flaky', description: 'Feels uncomfortable without moisturiser' },
    { id: 'sensitive', label: 'Sensitive or reactive', description: 'Reacts easily to products or weather changes' },
    { id: 'variable', label: 'Changes week to week', description: 'Hard to predict — varies with weather, cycle, stress' },
]

export default function Step3SkinType() {
    const { skin_type, setField, nextStep, prevStep } = useAssessmentStore()

    return (
        <div className="step step-3">
            <h2 className="step-title">By midday, how does your skin usually feel without any products on?</h2>
            <p className="step-subtitle">Think about a typical day — not your best or worst skin day.</p>

            <div className="option-list">
                {SKIN_TYPES.map(type => (
                    <button
                        key={type.id}
                        id={`skin-${type.id}`}
                        className={`option-btn option-btn-large ${skin_type === type.id ? 'option-selected' : ''}`}
                        onClick={() => setField('skin_type', type.id)}
                    >
                        <span className="option-label">{type.label}</span>
                        <span className="option-desc">{type.description}</span>
                    </button>
                ))}
            </div>

            <div className="step-nav">
                <button id="step3-back" className="btn-secondary" onClick={prevStep}>Back</button>
                <button id="step3-next" className="btn-primary" disabled={!skin_type} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
