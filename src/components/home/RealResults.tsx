"use client"

import { useEffect, useRef, useState } from 'react'

export default function RealResults() {
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

  const metrics = [
    { label: "Barrier Integrity", score: 88, color: "text-toneek-forest" },
    { label: "Treatment Tolerance", score: 82, color: "text-toneek-forest" },
    { label: "Climate Stress", score: 32, color: "text-toneek-amber", inverse: true }, // lower is better
    { label: "Melanin Sensitivity", score: 45, color: "text-toneek-amber", inverse: true },
    { label: "Pigmentation Load", score: 74, color: "text-toneek-amber" },
    { label: "Oil Balance", score: 71, color: "text-toneek-amber" },
    { label: "Inflammation Level", score: 85, color: "text-toneek-forest" },
    { label: "Hydration Status", score: 91, color: "text-toneek-forest" },
  ]

  return (
    <section 
      id="results"
      ref={sectionRef}
      className="w-full bg-toneek-cream py-20 lg:py-32 overflow-hidden"
    >
      <div 
        className={`w-full max-w-[1200px] mx-auto px-6 lg:px-12 transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="flex flex-col text-center mb-16 lg:mb-20">
          <span className="font-sans text-[11px] text-toneek-amber uppercase tracking-[3px] mb-4">What Changes</span>
          <h2 className="font-serif text-[36px] sm:text-[48px] text-toneek-brown mb-6">
            Eight metrics. All improving.
          </h2>
          <p className="font-sans text-[16px] text-toneek-gray max-w-[600px] mx-auto leading-relaxed">
            Every customer's skin is mapped across eight clinical dimensions. These scores update at each check-in. Here is what a typical profile looks like at Week 8.
          </p>
        </div>

        {/* 2x4 Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
          {metrics.map((metric, idx) => {
            // For inverse metrics (where lower is better), we might want to represent the "goodness" 
            // as the filled portion, or just fill it to the score.
            // A score of 32 for Climate Stress means 32% fill.
            const fillPercentage = metric.score;
            
            return (
              <div 
                key={idx} 
                className="bg-white rounded-xl p-6 lg:p-8 flex flex-col items-center justify-center text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-toneek-brown/5"
              >
                <div className="relative w-[72px] h-[72px] mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Ring */}
                    <path
                      className={`${metric.color} opacity-10`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    {/* Foreground Ring */}
                    <path
                      className={metric.color}
                      strokeDasharray="100, 100"
                      strokeDashoffset={100 - fillPercentage}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-serif text-[22px] font-bold ${metric.color}`}>
                      {metric.score}
                    </span>
                  </div>
                </div>
                
                <span className="font-sans text-[13px] font-medium text-toneek-brown max-w-[100px] leading-snug">
                  {metric.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <p className="font-sans text-[16px] text-toneek-brown max-w-[800px] mx-auto leading-relaxed">
            Scores are calculated from your clinical assessment and update after each check-in. They are not estimates — they are derived from your specific profile data.
          </p>
        </div>

      </div>
    </section>
  )
}
