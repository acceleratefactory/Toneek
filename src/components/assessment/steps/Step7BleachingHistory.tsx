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
    return (
        <div className="w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-2">Have you ever used skin-lightening or toning products?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                We ask this because it helps us understand your skin's current state.
                There is no judgment — many products sold as 'lightening' or 'toning' can affect how your skin responds to treatment.
            </p>

            <div className="flex flex-col gap-2 mb-6">
                {BLEACHING_OPTIONS.map(opt => (
                    <button
                        key={opt.id}
                        id={`bleaching-${opt.id}`}
                        className={`text-left w-full p-3.5 rounded-lg border-2 transition-all font-medium text-sm outline-none ${
                            bleaching_history === opt.id
                                ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
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
                <div className="mt-8 border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
                    <h3 className="text-gray-900 dark:text-gray-100 font-bold mb-4 text-sm">
                        Have you noticed any of these since stopping? Select all that apply.
                    </h3>
                    <div className="flex flex-col gap-2 mb-6">
                        {CESSATION_EFFECTS.map(effect => (
                            <button
                                key={effect.id}
                                id={`cessation-${effect.id}`}
                                className={`text-left w-full p-3.5 rounded-lg border-2 transition-all font-medium text-sm outline-none ${
                                    selected_effects.includes(effect.id)
                                        ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                        : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => toggleEffect(effect.id)}
                            >
                                {effect.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-3 mt-8">
                <button id="step7-back" className="w-[120px] py-3 rounded-lg font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors" onClick={prevStep}>Back</button>
                <button id="step7-next" className="flex-1 py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canProceed} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
