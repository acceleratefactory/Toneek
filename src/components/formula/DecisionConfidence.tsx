'use client'

// src/components/formula/DecisionConfidence.tsx
// Displays formula assignment confidence below the formula card.
// Two variants:
//   - Results page: "FORMULA CONFIDENCE: 74%" + progress bar + "Based on N similar profiles"
//   - Dashboard page: "SYSTEM CONFIDENCE: 74%" + improvement note
// Cold start (profileCount < 50): shows building message only — no percentage.

import { useEffect, useRef, useState } from 'react'

interface DecisionConfidenceProps {
  confidenceScore: number   // 0.0 – 1.0 from skin_assessments.confidence_score
  profileCount: number      // count of prediction_log records for this profile_segment
  variant?: 'results' | 'dashboard'
  delayMs?: number
}

export default function DecisionConfidence({
  confidenceScore,
  profileCount,
  variant = 'results',
  delayMs = 0,
}: DecisionConfidenceProps) {
  const pct = Math.round(confidenceScore * 100)
  const isColdStart = profileCount < 50

  // Animate the progress bar width from 0 to actual percentage
  const [barWidth, setBarWidth] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isColdStart) return
    timerRef.current = setTimeout(() => {
      // Small rAF delay so the CSS transition fires after mount
      requestAnimationFrame(() => setBarWidth(pct))
    }, delayMs + 200)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [pct, delayMs, isColdStart])

  if (isColdStart) {
    return (
      <div
        className="animate-slide-up opacity-0 bg-[#FAF8F5] dark:bg-[#1E1410] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-5 py-4 flex items-start gap-3"
        style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
      >
        {/* Pulsing indicator dot */}
        <span className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full bg-toneek-amber animate-pulse" />
        <div>
          <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest mb-0.5 font-sans">
            {variant === 'dashboard' ? 'System Confidence' : 'Formula Confidence'}
          </p>
          <p className="text-[13px] text-[#8C7B72] dark:text-[#A3938C] font-sans leading-snug">
            Building — formula assigned from clinical rules. Confidence improves as outcome data is collected.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="animate-slide-up opacity-0 bg-[#FAF8F5] dark:bg-[#1E1410] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl px-5 py-4"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans">
          {variant === 'dashboard' ? 'System Confidence' : 'Formula Confidence'}
        </p>
        <span className="text-[15px] font-bold text-toneek-brown dark:text-[#F0E6DF] font-sans">
          {pct}%
        </span>
      </div>

      {/* Animated progress bar */}
      <div className="w-full h-1.5 bg-[#E8E0DA] dark:bg-[#3A2820] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-toneek-amber rounded-full"
          style={{
            width: `${barWidth}%`,
            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      <p className="text-[12px] text-[#8C7B72] dark:text-[#7A6A62] font-sans">
        {variant === 'dashboard'
          ? '↑ Will improve as more outcome data is collected'
          : `Based on ${profileCount} similar profiles in the Toneek system`}
      </p>
    </div>
  )
}
