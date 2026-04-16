'use client'
// steps/Step8Medical.tsx
// Question A: pregnancy/breastfeeding
// Question B: hormonal contraception
// Question C: medications (NEW — includes isotretinoin flag)

import { useAssessmentStore } from '@/store/assessmentStore'

const MEDICATIONS = [
    { id: 'isotretinoin', label: 'Roaccutane / Isotretinoin', description: 'Prescribed for severe acne' },
    { id: 'spironolactone', label: 'Spironolactone', description: 'Prescribed for acne or hormonal conditions' },
    { id: 'antibiotics', label: 'Long-term oral antibiotics', description: '3 months or more (doxycycline, minocycline, etc.)' },
    { id: 'corticosteroids', label: 'Oral steroids', description: 'Prednisolone, dexamethasone, or similar' },
    { id: 'none', label: 'None of the above' },
    { id: 'prefer_not', label: 'Prefer not to say' },
]

export default function Step8Medical() {
    const { pregnant_or_breastfeeding, hormonal_contraception, medications, setField, nextStep, prevStep } = useAssessmentStore()
    const selected_meds = medications as string[]

    const toggleMed = (id: string) => {
        if (id === 'none' || id === 'prefer_not') {
            setField('medications', [id])
            return
        }
        const filtered = selected_meds.filter(m => m !== 'none' && m !== 'prefer_not')
        if (filtered.includes(id)) {
            setField('medications', filtered.filter(m => m !== id))
        } else {
            setField('medications', [...filtered, id])
        }
    }

    const canProceed = pregnant_or_breastfeeding !== null && hormonal_contraception !== null && selected_meds.length > 0

    return (
        <div className="step step-8">
            <h2 className="step-title">A few health questions</h2>
            <p className="step-subtitle">This helps us make sure your formula is safe and appropriate for you.</p>

            {/* Question A */}
            <div className="field-group">
                <label className="question-label">Are you currently pregnant or breastfeeding?</label>
                <div className="option-row">
                    <button id="pregnant-yes" className={`option-btn ${pregnant_or_breastfeeding === true ? 'option-selected' : ''}`} onClick={() => setField('pregnant_or_breastfeeding', true)}>Yes</button>
                    <button id="pregnant-no" className={`option-btn ${pregnant_or_breastfeeding === false ? 'option-selected' : ''}`} onClick={() => setField('pregnant_or_breastfeeding', false)}>No</button>
                </div>
            </div>

            {/* Question B */}
            <div className="field-group">
                <label className="question-label">Are you currently using hormonal contraception?</label>
                <p className="hint">Pill, implant, injection, patch, hormonal coil</p>
                <div className="option-row">
                    <button id="hormonal-yes" className={`option-btn ${hormonal_contraception === true ? 'option-selected' : ''}`} onClick={() => setField('hormonal_contraception', true)}>Yes</button>
                    <button id="hormonal-no" className={`option-btn ${hormonal_contraception === false ? 'option-selected' : ''}`} onClick={() => setField('hormonal_contraception', false)}>No</button>
                </div>
            </div>

            {/* Question C */}
            <div className="field-group">
                <label className="question-label">Are you currently taking any of these?</label>
                <p className="hint">This helps us avoid recommending ingredients that interact with your medication. We keep this information private.</p>
                <div className="option-list">
                    {MEDICATIONS.map(med => (
                        <button
                            key={med.id}
                            id={`med-${med.id}`}
                            className={`option-btn option-btn-large ${selected_meds.includes(med.id) ? 'option-selected' : ''}`}
                            onClick={() => toggleMed(med.id)}
                        >
                            <span className="option-label">{med.label}</span>
                            {med.description && <span className="option-desc">{med.description}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="step-nav">
                <button id="step8-back" className="btn-secondary" onClick={prevStep}>Back</button>
                <button id="step8-next" className="btn-primary" disabled={!canProceed} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
