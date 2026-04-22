'use client'
// steps/Step6Triggers.tsx
// Multi-select, no maximum. "I am not sure" option always available.

import { useAssessmentStore } from '@/store/assessmentStore'

const TRIGGERS = [
    { id: 'products_trigger', label: 'Starting or changing skincare products' },
    { id: 'weather_trigger', label: 'Weather changes or seasonal shifts' },
    { id: 'stress_trigger', label: 'Stress' },
    { id: 'hormonal_trigger', label: 'Hormonal changes', description: 'Period, pregnancy, contraception' },
    { id: 'diet_trigger', label: 'Diet or eating habits' },
    { id: 'unknown_trigger', label: 'I am not sure' },
]

export default function Step6Triggers() {
    const { triggers, setField, nextStep, prevStep } = useAssessmentStore()
    const selected = triggers as string[]

    const toggle = (id: string) => {
        if (selected.includes(id)) {
            setField('triggers', selected.filter(t => t !== id))
        } else {
            setField('triggers', [...selected, id])
        }
    }

    return (
        <div className="w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-2">What tends to make your skin worse?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Select all that apply — this helps us understand your skin's patterns.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {TRIGGERS.map(trigger => (
                    <button
                        key={trigger.id}
                        id={`trigger-${trigger.id}`}
                        className={`text-left w-full p-4 rounded-xl border-2 transition-all outline-none flex flex-col gap-1 ${
                            selected.includes(trigger.id)
                                ? 'bg-toneek-amber/10 border-toneek-amber'
                                : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => toggle(trigger.id)}
                    >
                        <span className={`font-bold text-sm ${selected.includes(trigger.id) ? 'text-toneek-amber' : 'text-gray-900 dark:text-gray-100'}`}>{trigger.label}</span>
                        {trigger.description && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{trigger.description}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex gap-3 mt-8">
                <button id="step6-back" className="w-[120px] py-3 rounded-lg font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors" onClick={prevStep}>Back</button>
                <button id="step6-next" className="flex-1 py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={selected.length === 0} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
