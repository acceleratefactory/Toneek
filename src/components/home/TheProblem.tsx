"use client"

import { useEffect, useRef, useState } from 'react'

export default function TheProblem() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const rows = [
    { label: "Formulated for your skin tone", generic: false, toneek: true },
    { label: "Climate-adaptive formula", generic: false, toneek: true },
    { label: "Outcome tracking at Week 2, 4, 8", generic: false, toneek: true },
    { label: "Formula improves over time", generic: false, toneek: true },
    { label: "Built for melanin-rich skin biology", generic: false, toneek: true },
    { label: "Custom compounded for you", generic: false, toneek: true }
  ]

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-toneek-cream py-20 lg:py-32 overflow-hidden"
    >
      <div 
        className={`w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        {/* Left Column */}
        <div className="flex flex-col max-w-[500px]">
          <span className="font-sans text-[11px] text-toneek-amber uppercase tracking-[3px] mb-6">The Problem</span>
          
          <h2 className="font-serif text-[32px] sm:text-[42px] leading-[1.1] text-toneek-brown mb-8">
            "The global skincare<br/>
            industry was not built<br/>
            for your skin."
          </h2>

          <p className="font-sans text-[16px] text-toneek-gray max-w-[420px] leading-relaxed mb-4">
            Every formula, every clinical trial, every "personalised" quiz was designed with lighter skin tones as the default. FST IV–VI skin — the skin of 1.5 billion people globally — has different melanin biology, different inflammatory responses, different reactions to UV and active ingredients.
          </p>
          <p className="font-sans text-[16px] text-toneek-gray max-w-[420px] leading-relaxed">
            No system was built for this. Until Toneek.
          </p>
        </div>

        {/* Right Column - Comparison Table */}
        <div className="w-full max-w-[600px] bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden border border-toneek-brown/5">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center border-b border-toneek-brown/5">
            <div className="p-4 sm:p-6" />
            <div className="w-[100px] sm:w-[140px] text-center p-4 sm:p-6">
              <span className="font-sans text-[10px] sm:text-[11px] font-semibold text-toneek-gray uppercase tracking-wider">Generic<br className="sm:hidden" /> Skincare</span>
            </div>
            <div className="w-[100px] sm:w-[140px] text-center p-4 sm:p-6 bg-toneek-amber/10 border-l border-toneek-brown/5">
              <span className="font-sans text-[10px] sm:text-[11px] font-bold text-toneek-amber uppercase tracking-wider">Toneek</span>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, idx) => (
            <div 
              key={idx} 
              className={`grid grid-cols-[1fr_auto_auto] items-center ${
                idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
              } ${idx !== rows.length - 1 ? 'border-b border-toneek-brown/5' : ''}`}
            >
              <div className="p-4 sm:p-6">
                <span className="font-sans text-[13px] sm:text-[14px] text-toneek-brown font-medium">{row.label}</span>
              </div>
              <div className="w-[100px] sm:w-[140px] flex items-center justify-center p-4 sm:p-6">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-toneek-gray/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="w-[100px] sm:w-[140px] flex items-center justify-center p-4 sm:p-6 bg-toneek-amber/5 border-l border-toneek-brown/5">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-toneek-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
