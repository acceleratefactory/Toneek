'use client'
// steps/Step9CurrentRoutine.tsx
// Question A: how many products currently used
// Question B: which actives (conditional — appears if 3_to_5 or 6_or_more)
// Question C: routine expectation

import { useAssessmentStore } from '@/store/assessmentStore'

const PRODUCT_COUNTS = [
    { id: '0_to_2', label: '0 to 2 products', description: 'Cleanser and moisturiser only, or nothing' },
    { id: '3_to_5', label: '3 to 5 products', description: 'A basic routine with a couple of extras' },
    { id: '6_or_more', label: '6 or more products', description: 'A full routine with multiple steps' },
]

const CURRENT_ACTIVES = [
    { id: 'active_treatment', label: 'A brightening serum or dark spot treatment' },
    { id: 'exfoliant', label: 'A chemical exfoliant (AHA, BHA, glycolic, salicylic acid)' },
    { id: 'retinoid', label: 'A retinol or retinoid product' },
    { id: 'multi_serum', label: 'Multiple serums at the same time' },
]

const ROUTINE_EXPECTATIONS = [
    { id: 'just_one', label: 'Just one product — the formula only', description: 'Simple, minimal, effective' },
    { id: 'two_to_three', label: 'Two to three products maximum', description: 'Formula + cleanser + moisturiser' },
    { id: 'whatever_it_takes', label: 'Whatever gets the best results', description: 'I am ready for a full routine' },
]

export default function Step9CurrentRoutine() {
    const { current_product_count, current_actives, routine_expectation, setField, nextStep, prevStep } = useAssessmentStore()
    const selected_actives = current_actives as string[]
    const showActives = current_product_count === '3_to_5' || current_product_count === '6_or_more'

    const toggleActive = (id: string) => {
        if (selected_actives.includes(id)) {
            setField('current_actives', selected_actives.filter(a => a !== id))
        } else {
            setField('current_actives', [...selected_actives, id])
        }
    }

    const canProceed = current_product_count && routine_expectation

    return (
        <div className="step step-9">
            <h2 className="step-title">Tell us about your current skincare routine</h2>

            {/* Question A */}
            <div className="field-group">
                <label className="question-label">How many products do you use on your skin right now?</label>
                <div className="option-list">
                    {PRODUCT_COUNTS.map(opt => (
                        <button
                            key={opt.id}
                            id={`count-${opt.id}`}
                            className={`option-btn option-btn-large ${current_product_count === opt.id ? 'option-selected' : ''}`}
                            onClick={() => {
                                setField('current_product_count', opt.id)
                                if (opt.id === '0_to_2') setField('current_actives', [])
                            }}
                        >
                            <span className="option-label">{opt.label}</span>
                            <span className="option-desc">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Question B — conditional */}
            {showActives && (
                <div className="field-group">
                    <label className="question-label">Do any of your current products contain these? Select all that apply.</label>
                    <div className="option-list">
                        {CURRENT_ACTIVES.map(active => (
                            <button
                                key={active.id}
                                id={`active-${active.id}`}
                                className={`option-btn ${selected_actives.includes(active.id) ? 'option-selected' : ''}`}
                                onClick={() => toggleActive(active.id)}
                            >
                                {active.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Question C */}
            <div className="field-group">
                <label className="question-label">How much of a routine are you looking for?</label>
                <div className="option-list">
                    {ROUTINE_EXPECTATIONS.map(opt => (
                        <button
                            key={opt.id}
                            id={`routine-${opt.id}`}
                            className={`option-btn option-btn-large ${routine_expectation === opt.id ? 'option-selected' : ''}`}
                            onClick={() => setField('routine_expectation', opt.id)}
                        >
                            <span className="option-label">{opt.label}</span>
                            <span className="option-desc">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="step-nav">
                <button id="step9-back" className="btn-secondary" onClick={prevStep}>Back</button>
                <button id="step9-next" className="btn-primary" disabled={!canProceed} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
