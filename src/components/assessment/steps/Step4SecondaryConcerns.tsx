'use client'
// steps/Step4SecondaryConcerns.tsx
// Multi-select, max 3. Primary concern excluded from options. "None" always available.

import { useAssessmentStore } from '@/store/assessmentStore'

const ALL_CONCERNS = [
    { id: 'PIH', label: 'Dark spots' },
    { id: 'acne', label: 'Active breakouts' },
    { id: 'tone', label: 'Uneven skin tone' },
    { id: 'dryness', label: 'Dry or tight skin' },
    { id: 'oiliness', label: 'Oily or shiny skin' },
    { id: 'texture', label: 'Rough texture' },
    { id: 'sensitivity', label: 'Sensitive or irritated' },
    { id: 'razor_bumps', label: 'Razor bumps' },
    { id: 'ageing', label: 'Signs of ageing' },
]

export default function Step4SecondaryConcerns() {
    const { primary_concern, secondary_concerns, setField, nextStep, prevStep } = useAssessmentStore()
    const available = ALL_CONCERNS.filter(c => c.id !== primary_concern)
    const selected = secondary_concerns as string[]

    const toggle = (id: string) => {
        if (id === 'none') { setField('secondary_concerns', []); return }
        if (selected.includes(id)) {
            setField('secondary_concerns', selected.filter(s => s !== id))
        } else if (selected.length < 3) {
            setField('secondary_concerns', [...selected, id])
        }
    }

    return (
        <div className="step step-4">
            <h2 className="step-title">Any other concerns? Choose up to 3.</h2>
            <p className="step-subtitle">These will not change your formula but help us personalise your explanation.</p>

            <div className="option-list">
                {available.map(concern => (
                    <button
                        key={concern.id}
                        id={`secondary-${concern.id}`}
                        className={`option-btn ${selected.includes(concern.id) ? 'option-selected' : ''} ${selected.length >= 3 && !selected.includes(concern.id) ? 'option-disabled' : ''}`}
                        onClick={() => toggle(concern.id)}
                        disabled={selected.length >= 3 && !selected.includes(concern.id)}
                    >
                        {concern.label}
                    </button>
                ))}
                <button
                    id="secondary-none"
                    className={`option-btn ${selected.length === 0 ? 'option-selected' : ''}`}
                    onClick={() => toggle('none')}
                >
                    None of the above
                </button>
            </div>

            {selected.length > 0 && (
                <p className="hint">{3 - selected.length} more can be selected</p>
            )}

            <div className="step-nav">
                <button id="step4-back" className="btn-secondary" onClick={prevStep}>Back</button>
                <button id="step4-next" className="btn-primary" onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
