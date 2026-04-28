'use client'

// src/components/formula/StickyCTA.tsx
// Sticky bottom conversion bar for /results and /dashboard/formula.
// Appears when scrollY > 400px.
// Disappears when user is within 200px of the bottom CTA element (if id supplied).
// Per toneek_dashboard_final_polish.md — Phase 1.

import { useEffect, useRef, useState } from 'react'

interface StickyCTAProps {
  formulaCode: string     // e.g. "GN-NT-01"
  subscribeHref: string   // e.g. "/subscribe?assessment_id=xxx"
  bottomCtaId?: string    // id of existing bottom CTA element to detect proximity
}

export default function StickyCTA({
  formulaCode,
  subscribeHref,
  bottomCtaId,
}: StickyCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY

      // Must be past 400px first
      if (scrollY <= 400) {
        setVisible(false)
        return
      }

      // Hide when within 200px of bottom CTA element
      if (bottomCtaId) {
        const el = document.getElementById(bottomCtaId)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= window.innerHeight + 200) {
            setVisible(false)
            return
          }
        }
      }

      setVisible(true)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [bottomCtaId])

  return (
    <div
      aria-hidden={!visible}
      className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-200 ease-out"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        backgroundColor: '#2A0F06',
        height: undefined, // handled via padding + min-height below
      }}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex items-center justify-between px-6 h-16">
        <p
          className="font-sans font-medium text-[13px]"
          style={{ color: '#F7F1EB' }}
        >
          Your formula:{' '}
          <span className="font-bold tracking-wide">{formulaCode}</span>
        </p>

        <a
          href={subscribeHref}
          className="font-sans font-medium text-[14px] text-white rounded-lg transition-opacity hover:opacity-90"
          style={{
            backgroundColor: '#C87D3E',
            padding: '10px 24px',
            borderRadius: '8px',
          }}
        >
          Start your treatment protocol
        </a>
      </div>

      {/* Mobile layout — full-width button, 56px bar */}
      <div className="flex sm:hidden items-center justify-center px-4 h-14">
        <a
          href={subscribeHref}
          className="w-full text-center font-sans font-medium text-[14px] text-white rounded-lg transition-opacity hover:opacity-90"
          style={{
            backgroundColor: '#C87D3E',
            padding: '12px 24px',
            borderRadius: '8px',
          }}
        >
          Start your treatment protocol
        </a>
      </div>
    </div>
  )
}
