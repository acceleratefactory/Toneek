'use client'
// src/app/assessment/page.tsx
// Entry point for the 10-step assessment flow.

import AssessmentForm from '@/components/assessment/AssessmentForm'

export default function AssessmentPage() {
    return (
        <main className="min-h-screen font-sans bg-toneek-cream dark:bg-[#1A1210] flex items-start justify-center px-4 py-8 sm:py-16 transition-colors">
            <div className="w-full max-w-[600px]">
                <div className="flex flex-col items-center justify-center mb-10">
                    <img src="/logo.svg" alt="Toneek" className="h-10 w-auto dark:hidden mb-2" />
                    <img src="/logo-dark.svg" alt="Toneek" className="h-10 w-auto hidden dark:block mb-2" />
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Skin intelligence for melanin-rich skin</span>
                </div>
                <AssessmentForm />
            </div>
        </main>
    )
}
