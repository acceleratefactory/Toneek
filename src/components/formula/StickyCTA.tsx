'use client'

// src/components/formula/StickyCTA.tsx
// Sticky bottom conversion bar for /results and /dashboard/formula.
// Uses IntersectionObserver (not window.scroll) — works inside any scroll container,
// including the dashboard's overflow-auto main element.
//
// triggerId:   element that, when it LEAVES the viewport (scrolled past), shows the CTA
// bottomCtaId: element that, when it ENTERS the viewport, hides the CTA
//
// Per toneek_dashboard_final_polish.md — Phase 1.

import { useEffect, useState } from 'react'

interface StickyCTAProps {
  formulaCode: string     // e.g. "GN-NT-01"
  subscribeHref: string   // e.g. "/subscribe?assessment_id=xxx"
  triggerId?: string      // id of sentinel element — CTA appears after this leaves view
  bottomCtaId?: string    // id of bottom CTA element — CTA hides when this enters view
}

export default function StickyCTA({
  formulaCode,
  subscribeHref,
  triggerId = 'sticky-cta-trigger',
  bottomCtaId,
}: StickyCTAProps) {
  const [pastTrigger, setPastTrigger] = useState(false)
  const [nearBottom, setNearBottom]   = useState(false)

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    // Show CTA when the trigger sentinel scrolls OUT of view
    const triggerEl = document.getElementById(triggerId)
    if (triggerEl) {
      const obs = new IntersectionObserver(
        ([entry]) => setPastTrigger(!entry.isIntersecting),
        { threshold: 0 }
      )
      obs.observe(triggerEl)
      observers.push(obs)
    }

    // Hide CTA when bottom CTA element scrolls INTO view (with 200px early buffer)
    if (bottomCtaId) {
      const bottomEl = document.getElementById(bottomCtaId)
      if (bottomEl) {
        const obs = new IntersectionObserver(
          ([entry]) => setNearBottom(entry.isIntersecting),
          { threshold: 0, rootMargin: '200px 0px 0px 0px' }
        )
        obs.observe(bottomEl)
        observers.push(obs)
      }
    }

    return () => observers.forEach(o => o.disconnect())
  }, [triggerId, bottomCtaId])

  const visible = pastTrigger && !nearBottom

  return (
    <div
      aria-hidden={!visible}
      className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-200 ease-out"
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)', backgroundColor: '#2A0F06' }}
    >
      {/* Desktop layout — 64px */}
      <div className="hidden sm:flex items-center justify-between px-6 h-16">
        <p className="font-sans font-medium text-[13px]" style={{ color: '#F7F1EB' }}>
          Your formula:{' '}
          <span className="font-bold tracking-wide">{formulaCode}</span>
        </p>
        <a
          href={subscribeHref}
          className="font-sans font-medium text-[14px] text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C87D3E', padding: '10px 24px', borderRadius: '8px' }}
        >
          Start your treatment protocol
        </a>
      </div>

      {/* Mobile layout — 56px, full-width button only */}
      <div className="flex sm:hidden items-center justify-center px-4 h-14">
        <a
          href={subscribeHref}
          className="w-full text-center font-sans font-medium text-[14px] text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C87D3E', padding: '12px 24px', borderRadius: '8px' }}
        >
          Start your treatment protocol
        </a>
      </div>
    </div>
  )
}
