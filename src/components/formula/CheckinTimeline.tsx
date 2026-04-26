'use client'

import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import Link from 'next/link'

export type CheckinState = 'COMPLETED' | 'DUE_NOW' | 'PENDING' | 'LOCKED'

export interface TimelineNode {
  week: number
  state: CheckinState
  score?: number // e.g. 8 (out of 10) if completed
  dateText?: string // "Available 24 April"
  description?: string
}

interface CheckinTimelineProps {
  nodes: TimelineNode[]
  delayMs?: number
  coldStartNote?: string     // optional footnote below the whole timeline
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function CheckinTimeline({ nodes, delayMs = 0, coldStartNote }: CheckinTimelineProps) {
  // Use state to trigger the line draw specifically on mount
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    // Delay mounting the drawing class so the line doesn't compute its height incorrectly
    const t = setTimeout(() => setMounted(true), delayMs)
    return () => clearTimeout(t)
  }, [delayMs])

  return (
    <div className="relative pl-4 overflow-hidden pt-2 pb-4">
      {/* 
        The actual vertical drawing line. We use an SVG to utilize stroke-dashoffset animation.
        A tall SVG strictly containing a vertical line. 
      */}
      <div className="absolute top-6 bottom-8 left-8 w-1 -ml-px z-0">
        <svg height="100%" width="2" className="overflow-visible">
          <line
            x1="1"
            y1="0"
            x2="1"
            y2="100%"
            stroke="#E8E0DA"
            strokeWidth="2"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            className="dark:stroke-[#3A2820]"
            style={{
              animation: mounted ? `lineDraw 0.8s ease-out forwards` : 'none',
              // Fallback length if standard percentage calculation fails natively in some browsers
              '--line-length': '1000px'
            } as React.CSSProperties}
          />
        </svg>
      </div>

      <div className="flex flex-col gap-8 relative z-10">
        {nodes.map((node, index) => {
          // Calculate individual node stagger (delayMs + lineDraw(800) + stagger)
          const nodeDelay = delayMs + 800 + (index * 250)

          const isCompleted = node.state === 'COMPLETED'
          const isDue = node.state === 'DUE_NOW'
          const isLocked = node.state === 'LOCKED'

          return (
            <div 
              key={node.week}
              className="flex gap-4 items-start opacity-0"
              style={{ animation: mounted ? `nodeAppear 0.3s ease-out ${nodeDelay}ms forwards` : 'none' }}
            >
              <div className="relative flex-shrink-0 mt-1">
                {/* Due Now Pulse Effect Ring */}
                {isDue && (
                  <div className="absolute inset-0 bg-transparent rounded-full animate-due-pulse" />
                )}
                
                {/* The Node Circle */}
                <div className={`w-9 h-9 flex items-center justify-center font-bold text-sm tracking-tight rounded-full transition-colors relative z-10 ${
                  isCompleted ? 'bg-toneek-forest text-white' :
                  isDue ? 'bg-toneek-amber text-white' :
                  isLocked ? 'bg-transparent border-2 border-gray-200 dark:border-[#3A2820] text-gray-400' :
                  'bg-toneek-brown dark:bg-[#302420] text-white'
                }`}>
                  {isCompleted ? <Check size={18} strokeWidth={3} /> : isLocked ? '‒' : node.week}
                </div>
              </div>

              <div className="flex flex-col">
                <h6 className="text-[15px] font-semibold text-gray-900 dark:text-[#F0E6DF] font-sans">
                  Week {node.week}
                </h6>
                
                {node.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-[13px] mt-1 leading-snug">
                    {node.description}
                  </p>
                )}

                {/* State based rendering */}
                {isCompleted && node.score !== undefined && (
                  <p className="text-toneek-forest dark:text-[#2E7A52] font-medium text-[13px] mt-0.5">
                    Completed ✓ • Score: {node.score}/10
                  </p>
                )}
                
                {isDue && (
                  <div className="mt-2">
                    <p className="text-toneek-amber dark:text-[#D4895A] font-semibold text-[13px] mb-2">
                      Due now
                    </p>
                    <Link 
                      href={`/dashboard/checkin?week=${node.week}`}
                      className="inline-block bg-toneek-amber hover:bg-[#A96429] text-white text-[13px] font-medium px-4 py-1.5 rounded-md transition-colors shadow-sm"
                    >
                      Complete Week {node.week} check-in →
                    </Link>
                  </div>
                )}
                
                {(node.state === 'PENDING' || isLocked) && node.dateText && (
                  <p className="text-gray-400 dark:text-[#A3938C] text-[13px] mt-0.5">
                    {node.dateText}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cold-start footnote — shown when formula_performance data is thin */}
      {coldStartNote && (
        <p className="mt-4 text-[11px] text-gray-400 dark:text-[#7A6A62] font-sans italic pl-4">
          {coldStartNote}
        </p>
      )}
    </div>
  )
}
