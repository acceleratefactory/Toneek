"use client"

import { useEffect, useRef, useState } from 'react'

export default function FormulaSystem() {
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

  const points = [
    {
      label: "CLIMATE-ADAPTIVE",
      text: "Your formula base changes based on where you live. Humid tropical climates require different vehicles than cold continental ones. The actives are the same. The delivery is not."
    },
    {
      label: "FST IV–VI SPECIFIC",
      text: "Active concentrations are calibrated for deeper melanin density, higher sebum production in tropical climates, and the specific inflammatory cascade that causes PIH in darker skin. Not adapted from lighter skin research. Built from it."
    },
    {
      label: "SELF-IMPROVING",
      text: "Every outcome data point from every customer makes the next assignment more accurate. At 200 profiles, the predictive engine activates. At 1,000, it outperforms any rule-based system."
    }
  ]

  const actives = [
    { name: "Niacinamide", conc: "10%", function: "Blocks melanin transfer", width: "100%" },
    { name: "Azelaic Acid", conc: "8%", function: "Tyrosinase inhibitor + anti-acne", width: "80%" },
    { name: "Salicylic Acid", conc: "1.5%", function: "Follicular exfoliant", width: "75%" }
  ]

  return (
    <section 
      id="the-formula"
      ref={sectionRef}
      className="w-full bg-white py-20 lg:py-32 overflow-hidden"
    >
      <div 
        className={`w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        {/* Left Column */}
        <div className="flex flex-col">
          <span className="font-sans text-[11px] text-toneek-amber uppercase tracking-[3px] mb-6">The Science</span>
          
          <h2 className="font-serif text-[36px] sm:text-[48px] leading-[1.1] text-toneek-brown mb-12">
            30 formulas.<br/>
            One for you.
          </h2>

          <div className="flex flex-col space-y-10">
            {points.map((point, idx) => (
              <div key={idx} className="flex flex-col pl-6 border-l-2 border-toneek-amber">
                <span className="font-sans text-[11px] text-toneek-gray font-semibold tracking-wider mb-2">
                  {point.label}
                </span>
                <p className="font-sans text-[15px] text-toneek-brown leading-relaxed max-w-[420px]">
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Formula Preview Card */}
        <div className="w-full max-w-[500px] mx-auto lg:ml-auto lg:mr-0 bg-white rounded-xl border border-toneek-brown shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden">
          
          {/* Card Header */}
          <div className="p-6 border-b border-toneek-brown/10">
            <span className="block font-sans text-[11px] text-toneek-amber uppercase tracking-wider mb-4">
              Sample Formula Preview
            </span>
            
            <h3 className="font-mono text-[28px] text-toneek-brown font-medium leading-none mb-2">
              LG-OA-01
            </h3>
            <p className="font-sans text-[16px] font-medium text-toneek-brown mb-5">
              Lagos Oil Control + Clarity
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {['Lagos', 'Oily', 'PIH'].map((pill, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="bg-toneek-amber/10 text-toneek-brown px-3 py-1 rounded-full font-sans text-[12px] font-medium border border-toneek-amber/20">
                    {pill}
                  </span>
                  {idx < 2 && <span className="ml-2 text-toneek-amber/50 text-[10px]">→</span>}
                </div>
              ))}
            </div>

            <div className="bg-[#FAFAFA] p-3 rounded-lg border border-toneek-brown/5">
              <p className="font-sans text-[13px] text-toneek-brown">
                🌴 Formulated for hot and humid climate (tropical)
              </p>
            </div>
          </div>

          {/* Active Ingredients Section */}
          <div className="p-6">
            <h4 className="font-sans text-[11px] text-toneek-gray uppercase tracking-wider mb-5">
              Active Ingredients
            </h4>
            
            <div className="flex flex-col space-y-6">
              {actives.map((active, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-sans font-semibold text-[14px] text-toneek-brown">
                        {active.name}
                      </span>
                      <span className="bg-toneek-amber text-white px-2 py-0.5 rounded-full font-sans text-[10px] font-bold tracking-wide">
                        {active.conc}
                      </span>
                    </div>
                  </div>
                  
                  <span className="font-sans text-[12px] text-toneek-gray mb-3">
                    {active.function}
                  </span>

                  <div className="w-full h-1.5 bg-toneek-amber/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-toneek-amber rounded-full"
                      style={{ width: active.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-[#FAFAFA] p-4 text-center border-t border-toneek-brown/5">
            <p className="font-sans text-[12px] text-toneek-gray">
              Your formula is assigned in under 500ms from your assessment.
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}
