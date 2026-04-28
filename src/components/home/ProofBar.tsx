"use client"

import { useEffect, useRef, useState } from 'react'

interface Stat {
  value: string;
  label: string;
  hasPlus?: boolean;
}

const stats: Stat[] = [
  { value: "30 Formula Codes", label: "Climate-calibrated actives" },
  { value: "6 Climate Zones", label: "Global formulation coverage" },
  { value: "10-Step Assessment", label: "Structured clinical intake" },
  { value: "Week 2 · 4 · 8", label: "Outcome tracking built in" },
  { value: "40 Countries", label: "Melanin-rich skin, anywhere", hasPlus: true }
]

export default function ProofBar() {
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

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-toneek-amber relative overflow-hidden"
    >
      <div 
        className={`w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center h-auto lg:h-[72px] py-6 lg:py-0 overflow-x-auto no-scrollbar transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="flex w-full min-w-max lg:min-w-0 justify-between items-center space-x-8 lg:space-x-0">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center">
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-sans font-semibold text-[15px] text-toneek-brown">
                  {stat.hasPlus ? stat.value.replace('40', '40+') : stat.value}
                </span>
                <span className="font-sans text-[11px] text-toneek-brown/60 mt-0.5">
                  {stat.label}
                </span>
              </div>
              {idx < stats.length - 1 && (
                <div className="hidden lg:block w-[1px] h-8 bg-toneek-brown/10 mx-6 xl:mx-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
