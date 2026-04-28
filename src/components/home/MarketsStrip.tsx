"use client"

import { useEffect, useRef, useState } from 'react'

export default function MarketsStrip() {
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

  const currencies = [
    { sym: "₦", label: "Nigeria (NGN)" },
    { sym: "£", label: "United Kingdom (GBP)" },
    { sym: "$", label: "United States (USD)" },
    { sym: "€", label: "Europe (EUR)" },
    { sym: "GH₵", label: "Ghana (GHS)" }
  ]

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-toneek-brown py-16 overflow-hidden border-t border-white/5"
    >
      <div 
        className={`w-full max-w-[1200px] mx-auto px-6 lg:px-12 flex flex-col items-center text-center transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <h3 className="font-sans font-semibold text-[18px] text-white mb-8">
          Available in your currency.
        </h3>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6">
          {currencies.map((curr, idx) => (
            <div 
              key={idx}
              className="flex items-center px-4 py-2 rounded-full border border-toneek-amber bg-toneek-brown shadow-[0_2px_8px_rgba(200,125,62,0.1)]"
            >
              <span className="font-sans font-bold text-[14px] text-toneek-amber mr-2">
                {curr.sym}
              </span>
              <span className="font-sans font-medium text-[13px] text-white">
                {curr.label}
              </span>
            </div>
          ))}
        </div>

        <p className="font-sans text-[12px] text-white/50">
          Payment by bank transfer. Custom compounded on confirmation.
        </p>

      </div>
    </section>
  )
}
