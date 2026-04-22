'use client'
// steps/Step2PrimaryConcern.tsx
// IMPORTANT: This is Step 2 — before skin type. The concern leads.

import { useAssessmentStore } from '@/store/assessmentStore'

const CONCERNS = [
    { id: 'PIH', label: 'Dark spots', description: 'Marks left by breakouts, irritation, or scars' },
    { id: 'acne', label: 'Active breakouts', description: 'Pimples, cysts, or persistent spots' },
    { id: 'tone', label: 'Uneven skin tone', description: 'Patchy colour, not uniform complexion' },
    { id: 'dryness', label: 'Dry or tight skin', description: 'Feels tight, rough, or flaky' },
    { id: 'oiliness', label: 'Oily or shiny skin', description: 'Shiny all over, congested pores' },
    { id: 'texture', label: 'Rough texture', description: 'Bumpy, uneven, or dull surface' },
    { id: 'sensitivity', label: 'Sensitive or irritated', description: 'Reacts easily, often red or uncomfortable' },
    { id: 'razor_bumps', label: 'Razor bumps', description: 'Bumps and dark spots from shaving' },
    { id: 'ageing', label: 'Signs of ageing', description: 'Fine lines, loss of firmness, dull skin' },
]

export default function Step2PrimaryConcern() {
    const { primary_concern, setField, nextStep, prevStep } = useAssessmentStore()

    return (
        <div className="w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-2">What is your main skin concern right now?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Choose the one that bothers you most. You can add others on the next step.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {CONCERNS.map(concern => (
                    <button
                        key={concern.id}
                        id={`concern-${concern.id}`}
                        className={`text-left w-full p-4 rounded-xl border-2 transition-all outline-none flex flex-col gap-1 ${
                            primary_concern === concern.id
                                ? 'bg-toneek-amber/10 border-toneek-amber'
                                : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setField('primary_concern', concern.id)}
                    >
                        <span className={`font-bold text-sm ${primary_concern === concern.id ? 'text-toneek-amber' : 'text-gray-900 dark:text-gray-100'}`}>{concern.label}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{concern.description}</span>
                    </button>
                ))}
            </div>

            <div className="flex gap-3 mt-8">
                <button id="step2-back" className="w-[120px] py-3 rounded-lg font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors" onClick={prevStep}>Back</button>
                <button id="step2-next" className="flex-1 py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={!primary_concern} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
