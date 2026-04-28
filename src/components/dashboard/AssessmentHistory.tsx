'use client'

// src/components/dashboard/AssessmentHistory.tsx
// Collapsible accordion showing all past assessments.
// Each row links to /results?assessment_id=XXX so customers can view
// their full results page from within the dashboard.
// No new sidebar tab created — lives only on the formula page.

import { useState } from 'react'

interface Assessment {
    id: string
    created_at: string
    formula_code: string | null
    skin_os_score: number | null
}

interface Props {
    assessments: Assessment[]
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function AssessmentHistory({ assessments }: Props) {
    const [open, setOpen] = useState(false)

    if (!assessments || assessments.length === 0) return null

    return (
        <div
            className="rounded-xl border font-sans mt-2"
            style={{ borderColor: '#E8E0DA', backgroundColor: '#FDFBF9' }}
        >
            {/* Header — toggles accordion */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                aria-expanded={open}
            >
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    Assessment History
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8C7B72"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        transition: 'transform 200ms ease',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Body — shown when open */}
            {open && (
                <div className="border-t" style={{ borderColor: '#E8E0DA' }}>
                    {assessments.map((a, i) => (
                        <div
                            key={a.id}
                            className="flex items-center justify-between px-5 py-3.5 gap-4"
                            style={{
                                borderBottom:
                                    i < assessments.length - 1
                                        ? '1px solid #F0EAE4'
                                        : 'none',
                            }}
                        >
                            {/* Left — date, code, score */}
                            <div className="flex items-center gap-3 min-w-0">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#C87D3E"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="flex-shrink-0"
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-[#2A0F06] truncate">
                                        {formatDate(a.created_at)}
                                        {a.formula_code && (
                                            <span className="ml-2 font-mono text-[12px] text-[#8C7B72]">
                                                {a.formula_code}
                                            </span>
                                        )}
                                    </p>
                                    {a.skin_os_score !== null && (
                                        <p className="text-[11px] text-[#8C7B72] mt-0.5">
                                            Skin OS Score: <span className="font-semibold text-[#2A0F06]">{a.skin_os_score}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right — link */}
                            <a
                                href={`/results?assessment_id=${a.id}`}
                                className="flex-shrink-0 inline-flex items-center gap-1 text-[12px] font-medium hover:opacity-70 transition-opacity"
                                style={{ color: '#2A0F06' }}
                            >
                                View results
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
