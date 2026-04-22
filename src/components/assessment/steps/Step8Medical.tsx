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
    return (
        <div className="w-full">
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl mb-2">A few health questions</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">This helps us make sure your formula is safe and appropriate for you.</p>

            {/* Question A */}
            <div className="mb-6">
                <label className="block text-gray-900 dark:text-gray-100 font-bold mb-2 text-sm">Are you currently pregnant or breastfeeding?</label>
                <div className="flex gap-3 mb-6">
                    <button id="pregnant-yes" className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all outline-none border-2 ${pregnant_or_breastfeeding === true ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber' : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'}`} onClick={() => setField('pregnant_or_breastfeeding', true)}>Yes</button>
                    <button id="pregnant-no" className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all outline-none border-2 ${pregnant_or_breastfeeding === false ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber' : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'}`} onClick={() => setField('pregnant_or_breastfeeding', false)}>No</button>
                </div>
            </div>

            {/* Question B */}
            <div className="mb-6">
                <label className="block text-gray-900 dark:text-gray-100 font-bold mb-1 text-sm">Are you currently using hormonal contraception?</label>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">Pill, implant, injection, patch, hormonal coil</p>
                <div className="flex gap-3 mb-6">
                    <button id="hormonal-yes" className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all outline-none border-2 ${hormonal_contraception === true ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber' : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'}`} onClick={() => setField('hormonal_contraception', true)}>Yes</button>
                    <button id="hormonal-no" className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all outline-none border-2 ${hormonal_contraception === false ? 'bg-toneek-amber/10 border-toneek-amber text-toneek-amber' : 'bg-gray-50 dark:bg-[#222] border-transparent text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'}`} onClick={() => setField('hormonal_contraception', false)}>No</button>
                </div>
            </div>

            {/* Question C */}
            <div className="mb-6">
                <label className="block text-gray-900 dark:text-gray-100 font-bold mb-1 text-sm">Are you currently taking any of these?</label>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">This helps us avoid recommending ingredients that interact with your medication. We keep this information private.</p>
                <div className="flex flex-col gap-2">
                    {MEDICATIONS.map(med => (
                        <button
                            key={med.id}
                            id={`med-${med.id}`}
                            className={`text-left w-full p-4 rounded-xl border-2 transition-all outline-none flex flex-col gap-1 ${
                                selected_meds.includes(med.id)
                                    ? 'bg-toneek-amber/10 border-toneek-amber'
                                    : 'bg-gray-50 dark:bg-[#222] border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => toggleMed(med.id)}
                        >
                            <span className={`font-bold text-sm ${selected_meds.includes(med.id) ? 'text-toneek-amber' : 'text-gray-900 dark:text-gray-100'}`}>{med.label}</span>
                            {med.description && <span className="text-gray-500 dark:text-gray-400 text-xs">{med.description}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                <button id="step8-back" className="w-[120px] py-3 rounded-lg font-bold text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors" onClick={prevStep}>Back</button>
                <button id="step8-next" className="flex-1 py-3 rounded-lg font-bold text-[#000000] bg-toneek-amber hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canProceed} onClick={nextStep}>Continue</button>
            </div>
        </div>
    )
}
