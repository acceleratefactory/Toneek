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
        <div className="assessment-form">
            {/* Progress bar */}
            <div className="progress-bar-track">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={currentStep}
                    aria-valuemin={1}
                    aria-valuemax={totalSteps}
                />
            </div>

            <div className="step-counter">
                Step {currentStep} of {totalSteps}
            </div>

            {/* Active step */}
            {StepComponent && <StepComponent />}
        </div>
    )
}
