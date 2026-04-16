'use client'
// src/app/assessment/page.tsx
// Entry point for the 10-step assessment flow.

import AssessmentForm from '@/components/assessment/AssessmentForm'

export default function AssessmentPage() {
    return (
        <main className="assessment-page">
            <div className="assessment-container">
                <div className="assessment-header">
                    <span className="brand">Toneek</span>
                    <span className="tagline">Skin intelligence for melanin-rich skin</span>
                </div>
                <AssessmentForm />
            </div>
        </main>
    )
}
