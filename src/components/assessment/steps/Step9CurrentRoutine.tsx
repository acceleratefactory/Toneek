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
        <div className="w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-6">Tell us about your current skincare routine</h2>

            {/* Question A */}
            {/* Question A */}
            <div className="mb-6">
                <label className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">How many products do you use on your skin right now?</label>
                <div className="flex flex-col gap-2">
                    {PRODUCT_COUNTS.map(opt => (
                        <button
                            key={opt.id}
                            id={`count-${opt.id}`}
                            className={`text-left w-full p-4 rounded-xl border-2 transition-all outline-none flex flex-col gap-1 ${
                                current_product_count === opt.id
                                    ? 'bg-toneek-amber/10 border-toneek-amber'
                                    : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => {
                                setField('current_product_count', opt.id)
                                if (opt.id === '0_to_2') setField('current_actives', [])
                            }}
                        >
                            <span className={`font-bold text-sm ${current_product_count === opt.id ? 'text-toneek-amber' : 'text-gray-900 dark:text-gray-100'}`}>{opt.label}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Question B — conditional */}
            {showActives && (
                <div className="mb-6 border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
                    <label className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">Do any of your current products contain these? Select all that apply.</label>
                    <div className="flex flex-col gap-2">
                        {CURRENT_ACTIVES.map(active => (
                            <button
                                key={active.id}
                                id={`active-${active.id}`}
                                className={`text-left w-full p-3.5 rounded-lg border-2 transition-all font-medium text-sm outline-none ${
                                    selected_actives.includes(active.id)
                                        ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                        : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => toggleActive(active.id)}
                            >
                                {active.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Question C */}
            {/* Question C */}
            <div className="mt-8 border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
                <label className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">How much of a routine are you looking for?</label>
                <div className="flex flex-col gap-2">
                    {ROUTINE_EXPECTATIONS.map(opt => (
                        <button
                            key={opt.id}
                            id={`routine-${opt.id}`}
                            className={`text-left w-full p-4 rounded-xl border-2 transition-all outline-none flex flex-col gap-1 ${
                                routine_expectation === opt.id
                                    ? 'bg-toneek-amber/10 border-toneek-amber'
                                    : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => setField('routine_expectation', opt.id)}
                        >
                            <span className={`font-bold text-sm ${routine_expectation === opt.id ? 'text-toneek-amber' : 'text-gray-900 dark:text-gray-100'}`}>{opt.label}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                <button id="step9-back" className="w-[120px] py-3 rounded-lg font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors" onClick={prevStep}>Back</button>
                <button id="step9-next" className="flex-1 py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canProceed} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
