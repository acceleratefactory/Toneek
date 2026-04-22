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
        <div className="w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-2">Any other concerns? Choose up to 3.</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">These will not change your formula but help us personalise your explanation.</p>

            <div className="flex flex-col gap-2 mb-6">
                {available.map(concern => (
                    <button
                        key={concern.id}
                        id={`secondary-${concern.id}`}
                        className={`text-left w-full p-3.5 rounded-lg border-2 transition-all font-medium text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                            selected.includes(concern.id)
                                ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => toggle(concern.id)}
                        disabled={selected.length >= 3 && !selected.includes(concern.id)}
                    >
                        {concern.label}
                    </button>
                ))}
                <button
                    id="secondary-none"
                    className={`text-left w-full p-3.5 rounded-lg border-2 transition-all font-medium text-sm outline-none mt-2 ${
                        selected.length === 0
                            ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                            : 'bg-transparent border-gray-300 dark:border-[#2a2a2a] text-gray-500 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    onClick={() => toggle('none')}
                >
                    None of the above
                </button>
            </div>

            {selected.length > 0 && (
                <p className="text-gray-500 text-xs mt-2">{3 - selected.length} more can be selected</p>
            )}

            <div className="flex gap-3 mt-8">
                <button id="step4-back" className="w-[120px] py-3 rounded-lg font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors" onClick={prevStep}>Back</button>
                <button id="step4-next" className="flex-1 py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
