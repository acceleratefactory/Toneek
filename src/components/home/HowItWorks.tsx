"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function HowItWorks() {
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

  const steps = [
    {
      num: 1,
      title: "ASSESS",
      heading: "10-step clinical assessment",
      body: "We collect 13+ structured data points — your location, skin history, hormonal context, current routine, and skin concerns. This is not a quiz. It is a clinical intake.",
      hasLink: true,
      icon: (
        <svg className="w-10 h-10 text-toneek-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      num: 2,
      title: "ASSIGN",
      heading: "Instant formula assignment",
      body: "Our rule engine assigns one of 30 climate-calibrated formula codes in under 500 milliseconds. Your base formula, active ingredients, and concentrations are chosen for your specific profile.",
      hasLink: false,
      icon: (
        <svg className="w-10 h-10 text-toneek-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      num: 3,
      title: "FORMULATE",
      heading: "Custom compounded for you",
      body: "Your formula is manufactured to order. Not picked from a shelf. Every ingredient, every concentration, every base is specific to your assessment result.",
      hasLink: false,
      icon: (
        <svg className="w-10 h-10 text-toneek-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      num: 4,
      title: "TRACK",
      heading: "Outcomes at Week 2, 4, 8",
      body: "A single question at Week 2, 4, and 8 collects your outcome data. The system uses this to improve future assignments — yours and everyone else's with a similar profile.",
      hasLink: false,
      icon: (
        <svg className="w-10 h-10 text-toneek-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ]

  // Fix icon for step 2 (Hexagon / Toneek symbol)
  steps[1].icon = (
    <svg className="w-10 h-10 text-toneek-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
    </svg>
  )

  return (
    <section 
      id="how-it-works"
      ref={sectionRef}
      className="w-full bg-toneek-brown py-20 lg:py-32 overflow-hidden relative"
    >
      <div 
        className={`w-full max-w-[1400px] mx-auto px-6 lg:px-12 transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="flex flex-col mb-16 lg:mb-24">
          <span className="font-sans text-[11px] text-toneek-amber uppercase tracking-[3px] mb-4">The Process</span>
          <h2 className="font-serif text-[36px] sm:text-[48px] text-white">
            Four steps to skin that works.
          </h2>
        </div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-[20px] left-[5%] right-[5%] h-[1px] border-t-2 border-dashed border-toneek-amber/20 z-0"></div>

          {/* Connector line (mobile) */}
          <div className="lg:hidden absolute top-[20px] bottom-[20px] left-[20px] w-[1px] border-l-2 border-dashed border-toneek-amber/20 z-0"></div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center relative">
                
                {/* Icon wrapper with solid bg to mask the line */}
                <div className="bg-toneek-brown p-2 -ml-2 lg:ml-0 flex-shrink-0 relative z-10">
                  {step.icon}
                </div>

                <div className="ml-6 lg:ml-0 mt-0 lg:mt-8 flex flex-col items-start lg:items-center">
                  <span className="font-sans text-[11px] text-toneek-amber uppercase tracking-[2px] mb-3">
                    STEP {step.num} — {step.title}
                  </span>
                  
                  <h3 className="font-sans font-semibold text-[18px] text-white mb-4">
                    {step.heading}
                  </h3>
                  
                  <p className="font-sans text-[14px] text-white/70 leading-relaxed max-w-[280px]">
                    {step.body}
                  </p>

                  {step.hasLink && (
                    <Link 
                      href="/assessment" 
                      className="mt-6 font-sans text-[14px] font-medium text-toneek-amber hover:text-[#D4895A] transition-colors inline-flex items-center group"
                    >
                      See the assessment 
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
