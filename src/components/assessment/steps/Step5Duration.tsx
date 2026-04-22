'use client'
// steps/Step5Duration.tsx
// Question A: how long has the concern existed.
// Question B: trajectory — appears after A is answered.

import { useAssessmentStore } from '@/store/assessmentStore'

const DURATIONS = [
    { id: 'less_than_1_month', label: 'Less than 1 month', description: 'This is relatively new' },
    { id: '1_to_6_months', label: '1–6 months', description: 'A few months now' },
    { id: '6_to_12_months', label: '6–12 months', description: 'About a year' },
    { id: 'more_than_1_year', label: 'More than 1 year', description: 'This has been ongoing for a while' },
]

const TRAJECTORIES = [
    { id: 'improving', label: 'Getting better on its own' },
    { id: 'staying_the_same', label: 'Staying about the same' },
    { id: 'getting_worse', label: 'Getting worse over time' },
]

export default function Step5Duration() {
    const { concern_duration, concern_trajectory, setField, nextStep, prevStep } = useAssessmentStore()

    const canProceed = concern_duration && concern_trajectory

    return (
        <div className="w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-6">How long have you had this concern?</h2>

            <div className="flex flex-col gap-2 mb-6">
                {DURATIONS.map(d => (
                    <button
                        key={d.id}
                        id={`duration-${d.id}`}
                        className={`text-left w-full p-4 rounded-xl border-2 transition-all outline-none flex flex-col gap-1 ${
                            concern_duration === d.id
                                ? 'bg-toneek-amber/10 border-toneek-amber'
                                : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setField('concern_duration', d.id)}
                    >
                        <span className={`font-bold text-sm ${concern_duration === d.id ? 'text-toneek-amber' : 'text-gray-900 dark:text-gray-100'}`}>{d.label}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{d.description}</span>
                    </button>
                ))}
            </div>

            {concern_duration && (
                <div className="mt-8 border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
                    <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-6">And over that time, has it been…</h2>
                    <div className="flex flex-col gap-2">
                        {TRAJECTORIES.map(t => (
                            <button
                                key={t.id}
                                id={`trajectory-${t.id}`}
                                className={`text-left w-full p-3.5 rounded-lg border-2 transition-all font-medium text-sm outline-none ${
                                    concern_trajectory === t.id
                                        ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber'
                                        : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => setField('concern_trajectory', t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-3 mt-8">
                <button id="step5-back" className="w-[120px] py-3 rounded-lg font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors" onClick={prevStep}>Back</button>
                <button id="step5-next" className="flex-1 py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canProceed} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
