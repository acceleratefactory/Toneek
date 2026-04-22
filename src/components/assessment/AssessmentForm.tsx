'use client'
// src/components/assessment/AssessmentForm.tsx
// Wrapper that renders the correct step component based on Zustand currentStep.

import { useAssessmentStore } from '@/store/assessmentStore'
import Step1Location from './steps/Step1Location'
import Step2PrimaryConcern from './steps/Step2PrimaryConcern'
import Step3SkinType from './steps/Step3SkinType'
import Step4SecondaryConcerns from './steps/Step4SecondaryConcerns'
import Step5Duration from './steps/Step5Duration'
import Step6Triggers from './steps/Step6Triggers'
import Step7BleachingHistory from './steps/Step7BleachingHistory'
import Step8Medical from './steps/Step8Medical'
import Step9CurrentRoutine from './steps/Step9CurrentRoutine'
import Step10PhotoEmail from './steps/Step10PhotoEmail'

const STEPS = [
    Step1Location,
    Step2PrimaryConcern,
    Step3SkinType,
    Step4SecondaryConcerns,
    Step5Duration,
    Step6Triggers,
    Step7BleachingHistory,
    Step8Medical,
    Step9CurrentRoutine,
    Step10PhotoEmail,
]

export default function AssessmentForm() {
    const { currentStep, totalSteps } = useAssessmentStore()

    const StepComponent = STEPS[currentStep - 1]
    const progress = (currentStep / totalSteps) * 100

    return (
        <div className="w-full">
            {/* Progress bar */}
            <div className="bg-gray-200 dark:bg-[#1a1a1a] rounded-sm h-1 mb-3 overflow-hidden">
                <div
                    className="bg-toneek-amber h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={currentStep}
                    aria-valuemin={1}
                    aria-valuemax={totalSteps}
                />
            </div>

            <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-8">
                Step {currentStep} of {totalSteps}
            </div>

            {/* Active step wrapper */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-xl p-6 sm:p-8 shadow-sm">
                {StepComponent && <StepComponent />}
            </div>
        </div>
    )
}
