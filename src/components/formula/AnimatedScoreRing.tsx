'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedScoreRingProps {
  score: number      // 0–100
  size: number       // diameter in px (72 | 120 | 180 | 200)
  strokeWidth?: number
  label?: string     // tier label e.g. "Good progress"
  showLabel?: boolean
  delay?: number     // animation delay in ms
}

export default function AnimatedScoreRing({
  score,
  size,
  strokeWidth = 8,
  label,
  showLabel = true,
  delay = 0,
}: AnimatedScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [animationStarted, setAnimationStarted] = useState(false)
  const animRef = useRef<number>()

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (displayScore / 100) * circumference

  const getColour = (s: number) => {
    if (s >= 80) return '#1C5C3A'
    if (s >= 60) return '#C87D3E'
    if (s >= 40) return '#8C7B72'
    return '#C13B2E'
  }

  const colour = getColour(score)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStarted(true)
      const startTime = performance.now()
      const duration = 1800

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayScore(Math.round(eased * score))
        if (progress < 1) {
          animRef.current = window.requestAnimationFrame(animate)
        }
      }

      animRef.current = window.requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timer)
      if (animRef.current) window.cancelAnimationFrame(animRef.current)
    }
  }, [score, delay])

  const fontSize = size >= 160 ? 48 : size >= 100 ? 28 : 18
  const labelSize = size >= 160 ? 13 : 11

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8E0DA"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      {/* Score number overlaid */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size, marginTop: `-${size}px` }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 600,
            color: colour,
            fontFamily: "'Jost', system-ui",
            lineHeight: 1,
          }}
        >
          {displayScore}
        </span>
        {showLabel && label && (
          <span
            style={{
              fontSize: labelSize,
              color: '#8C7B72',
              fontFamily: "'Jost', system-ui",
              marginTop: 4,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
