"use client"

import { useEffect, useRef, useState } from 'react'

export default function GlobalReach() {
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

  const climates = [
    {
      emoji: "🌴",
      name: "Humid Tropical",
      cities: "Lagos · Accra · Kingston · Houston · Miami",
      desc: "Lightweight gel base. Full active concentrations. Formulated for 85%+ humidity."
    },
    {
      emoji: "☀️",
      name: "Semi-Arid",
      cities: "Abuja · Dubai · Johannesburg · Riyadh",
      desc: "Medium lotion base. UV-intensive formulation. Harmattan protocol active October–February."
    },
    {
      emoji: "🌧️",
      name: "Temperate Maritime",
      cities: "London · Amsterdam · Dublin · Paris · Vancouver",
      desc: "Richer base. Barrier-support priority. Climate transition protocol for diaspora."
    },
    {
      emoji: "❄️",
      name: "Cold Continental",
      cities: "New York · Chicago · Toronto · Berlin",
      desc: "Intensive barrier formula. Ceramic complex. Seasonal adaptation built in."
    },
    {
      emoji: "⛅",
      name: "Mediterranean",
      cities: "Cape Town · Los Angeles · Sydney · Barcelona",
      desc: "UV-adapted base. Warm-dry season calibration."
    },
    {
      emoji: "🌿",
      name: "Equatorial",
      cities: "Douala · Kinshasa · Freetown",
      desc: "Ultra-lightweight. Maximum humidity tolerance."
    }
  ]

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-toneek-cream py-20 lg:py-32 overflow-hidden"
    >
      <div 
        className={`w-full max-w-[1000px] mx-auto px-6 lg:px-12 transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="flex flex-col text-center mb-16 lg:mb-20">
          <h2 className="font-serif text-[32px] sm:text-[40px] text-toneek-brown leading-tight">
            Built for melanin-rich skin.<br className="hidden sm:block" /> Wherever you live.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-12">
          {climates.map((climate, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-xl border border-toneek-brown/5 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:border-toneek-brown/10 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <div className="flex flex-col h-full">
                <span className="text-[32px] mb-4 leading-none">{climate.emoji}</span>
                <h3 className="font-sans font-semibold text-[15px] text-toneek-brown mb-1">
                  {climate.name}
                </h3>
                <span className="font-sans text-[11px] font-semibold text-toneek-amber uppercase tracking-wider mb-3">
                  {climate.cities}
                </span>
                <p className="font-sans text-[13px] text-toneek-gray leading-relaxed mt-auto">
                  {climate.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center max-w-[600px] mx-auto">
          <p className="font-sans italic text-[13px] text-toneek-gray/80 leading-relaxed">
            Your location is detected automatically.<br className="hidden sm:block" />
            If your city is not in our database, you select your climate profile manually — 6 illustrated options.
          </p>
        </div>

      </div>
    </section>
  )
}
