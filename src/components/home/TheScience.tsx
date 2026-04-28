"use client"

import { useEffect, useRef, useState } from 'react'

export default function TheScience() {
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

  const tiles = [
    {
      name: "Niacinamide",
      desc: "Blocks melanin transfer from melanocytes to keratinocytes at the cellular level. Not just surface brightening.",
      icon: (
        // Molecular hexagon
        <svg className="w-8 h-8 text-toneek-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    },
    {
      name: "Azelaic Acid",
      desc: "Inhibits tyrosinase — the enzyme that produces melanin. Clinical evidence across FST IV–VI skin.",
      icon: (
        // Chain molecule
        <svg className="w-8 h-8 text-toneek-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
    {
      name: "Tranexamic Acid",
      desc: "Targets the hormonal pigmentation pathway — specific to melasma and hormonally-triggered PIH.",
      icon: (
        // Pathway diagram
        <svg className="w-8 h-8 text-toneek-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      name: "Centella Asiatica",
      desc: "Barrier repair. Anti-inflammatory. The foundation of every Restoration Protocol formula.",
      icon: (
        // Leaf structure
        <svg className="w-8 h-8 text-toneek-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    }
  ]

  return (
    <section 
      id="science"
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
          
          <h2 className="font-serif text-[32px] sm:text-[36px] leading-[1.2] text-toneek-brown mb-8 max-w-[500px]">
            "Most skincare is designed<br/>
            for Fitzpatrick types I–III.<br/><br/>
            We built for IV, V, and VI."
          </h2>

          <div className="font-sans text-[16px] text-toneek-gray leading-relaxed max-w-[480px] space-y-6">
            <p>
              Melanin-rich skin has a higher melanocyte response to inflammation. Every breakout, every irritation, every aggressive active applied at the wrong concentration creates post-inflammatory hyperpigmentation.
            </p>
            <p>
              This is not a cosmetic problem. It is a clinical one.
            </p>
            <p>
              Toneek's formula system uses concentration ranges, base formulas, and active combinations validated specifically for FST IV–VI skin biology — not adapted from lighter-skin research.
            </p>
          </div>
        </div>

        {/* Right Column - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 w-full max-w-[600px] lg:ml-auto">
          {tiles.map((tile, idx) => (
            <div 
              key={idx}
              className="bg-white border border-[#E8E0DA] rounded-[10px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="mb-4">
                {tile.icon}
              </div>
              <h3 className="font-sans font-semibold text-[14px] text-toneek-brown mb-2">
                {tile.name}
              </h3>
              <p className="font-sans text-[13px] text-toneek-gray leading-relaxed">
                {tile.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
