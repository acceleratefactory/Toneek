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
        <div className="w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-2">By midday, how does your skin usually feel without any products on?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Think about a typical day — not your best or worst skin day.</p>

            <div className="flex flex-col gap-2 mb-6">
                {SKIN_TYPES.map(type => (
                    <button
                        key={type.id}
                        id={`skin-${type.id}`}
                        className={`text-left w-full p-4 rounded-xl border-2 transition-all outline-none flex flex-col gap-1 ${
                            skin_type === type.id
                                ? 'bg-toneek-amber/10 border-toneek-amber'
                                : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setField('skin_type', type.id)}
                    >
                        <span className={`font-bold text-sm ${skin_type === type.id ? 'text-toneek-amber' : 'text-gray-900 dark:text-gray-100'}`}>{type.label}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{type.description}</span>
                    </button>
                ))}
            </div>

            <div className="flex gap-3 mt-8">
                <button id="step3-back" className="w-[120px] py-3 rounded-lg font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors" onClick={prevStep}>Back</button>
                <button id="step3-next" className="flex-1 py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={!skin_type} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
