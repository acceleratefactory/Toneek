'use client'

import React from 'react'

interface ClinicalSynthesisProps {
  rationale?: string
  delayMs?: number
}

export default function ClinicalSynthesis({ rationale, delayMs = 0 }: ClinicalSynthesisProps) {
  const defaultRationale = "Your formula has been dynamically generated to balance active intervention with barrier preservation. Follow your protocol closely to ensure safe adaptation."
  const text = rationale && rationale.trim().length > 0 ? rationale : defaultRationale

  return (
    <div 
      className="w-full bg-gradient-to-br from-[#FEF9F3] to-white dark:from-[#2A1C10] dark:to-[#1A1210] border border-toneek-amber/20 rounded-xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Subtle background glow effect */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-toneek-amber/5 rounded-full blur-3xl pointer-events-none" />

      <h5 className="text-[11px] font-bold text-toneek-amber uppercase tracking-widest font-sans mb-3 flex items-center gap-2">
        <span className="text-[14px]">✨</span> Clinical Synthesis
      </h5>
      <p className="text-[14px] sm:text-[15px] text-toneek-brown dark:text-[#F0E6DF] leading-relaxed font-sans font-medium max-w-4xl">
        {text}
      </p>
    </div>
  )
}
