"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function FinalCTA() {
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
      className="w-full bg-toneek-amber py-[100px] overflow-hidden"
    >
      <div 
        className={`w-full max-w-[1000px] mx-auto px-6 lg:px-12 flex flex-col items-center text-center transition-all duration-700 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <h2 className="font-serif text-[40px] sm:text-[56px] leading-[1.1] text-toneek-brown mb-6">
          Start with your skin.<br/>
          Not someone else's formula.
        </h2>

        <p className="font-sans text-[16px] sm:text-[18px] text-toneek-brown/75 max-w-[600px] leading-relaxed mb-10">
          3-minute assessment. Instant formula assignment. Custom compounded for your skin.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8 w-full sm:w-auto">
          <Link 
            href="/assessment"
            className="w-full sm:w-auto flex items-center justify-center bg-toneek-brown text-white font-sans font-semibold text-[16px] px-10 py-[18px] rounded-lg transition-transform hover:scale-[1.02] shadow-lg"
          >
            Start your skin assessment
          </Link>
          
          <Link 
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center bg-transparent border-2 border-toneek-brown text-toneek-brown font-sans font-semibold text-[16px] px-10 py-[16px] rounded-lg transition-colors hover:bg-toneek-brown/5"
          >
            Log in to your account
          </Link>
        </div>

        <p className="font-sans text-[12px] text-toneek-brown/50">
          Payment by bank transfer only. Custom compounded on payment confirmation.
        </p>

      </div>
    </section>
  )
}
