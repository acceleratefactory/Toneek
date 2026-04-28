"use client"

import { useEffect, useRef, useState } from 'react'

export default function ClinicalTrajectory() {
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

  const milestones = [
    {
      week: 2,
      heading: "Week 2",
      body: "Skin inflammation calming. Barrier beginning to stabilise. No visible pigment change at this stage — this is normal and expected.",
      stat: "First clinical data point collected",
      highlight: false
    },
    {
      week: 4,
      heading: "Week 4",
      body: "Visible improvement beginning. 65–72% of profiles on targeted brightening actives see measurable tone improvement at Week 4.",
      stat: "Formula review eligibility begins",
      highlight: false
    },
    {
      week: 8,
      heading: "Week 8",
      body: "Measurable change in primary concern. Skin OS Score recalculated from your check-in data. 70–78% of FST IV–VI patients achieve measurable improvement at Week 8.",
      stat: "Skin OS Score recalculated",
      highlight: true
    }
  ]

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-toneek-brown py-20 lg:py-32 overflow-hidden"
    >
      <div 
        className={`w-full max-w-[1200px] mx-auto px-6 lg:px-12 transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="flex flex-col text-center mb-16 lg:mb-20">
          <h2 className="font-serif text-[36px] sm:text-[48px] text-white">
            What to expect.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {milestones.map((ms, idx) => (
            <div 
              key={idx}
              className={`flex flex-col p-8 lg:p-10 rounded-xl transition-all duration-300 ${
                ms.highlight 
                  ? 'bg-[#C87D3E]/15 border border-toneek-amber' 
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {/* Number Circle */}
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-8 ${
                  ms.highlight ? 'bg-toneek-forest text-white' : 'bg-toneek-amber text-toneek-brown'
                }`}
              >
                <span className="font-sans font-bold text-[16px]">{ms.week}</span>
              </div>

              <h3 
                className={`font-sans font-semibold text-[20px] mb-4 ${
                  ms.highlight ? 'text-toneek-amber' : 'text-white'
                }`}
              >
                {ms.heading}
              </h3>

              <p className="font-sans text-[15px] text-white/70 leading-relaxed flex-grow">
                {ms.body}
              </p>

              <div className="mt-8 pt-6 border-t border-white/10">
                <span 
                  className={`font-sans text-[11px] font-bold uppercase tracking-[1px] ${
                    ms.highlight ? 'text-toneek-forest' : 'text-toneek-amber'
                  }`}
                >
                  {ms.stat}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
