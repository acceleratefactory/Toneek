'use client'

import React, { useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

export type CheckinState = 'COMPLETED' | 'DUE_NOW' | 'PENDING' | 'LOCKED'

export interface TimelineNode {
  week: number
  state: CheckinState
  score?: number        // e.g. 8 (out of 10) if completed
  dateText?: string     // "Available 24 April"
  description?: string
  evidenceNote?: string // clinical evidence statement added at page level
}

interface CheckinTimelineProps {
  nodes: TimelineNode[]
  delayMs?: number
  coldStartNote?: string     // optional footnote below the whole timeline
  probabilityFooter?: string // 11px warm grey italic — below all nodes
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function CheckinTimeline({ nodes, delayMs = 0, coldStartNote, probabilityFooter }: CheckinTimelineProps) {
  const [mounted, setMounted] = useState(false)
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delayMs)
    return () => clearTimeout(t)
  }, [delayMs])

  // Determine current stage
  let currentStageWeek = 0
  const w2 = nodes.find(n => n.week === 2)
  const w4 = nodes.find(n => n.week === 4)
  const w8 = nodes.find(n => n.week === 8)

  if (w8?.state === 'COMPLETED') currentStageWeek = 12
  else if (w4?.state === 'COMPLETED') currentStageWeek = 8
  else if (w2?.state === 'COMPLETED') currentStageWeek = 4
  else if (w2?.state === 'LOCKED' && w2?.dateText?.includes('delivery')) currentStageWeek = 0
  else currentStageWeek = 2

  const stages = [
    { week: 0, label: 'FOUNDATION', displayWeek: 'Week 0' },
    { week: 2, label: 'STABILISING', displayWeek: 'Week 2' },
    { week: 4, label: 'IMPROVING', displayWeek: 'Week 4' },
    { week: 8, label: 'OPTIMISING', displayWeek: 'Week 8' },
    { week: 12, label: 'MAINTENANCE', displayWeek: 'Week 12+' }
  ]

  return (
    <div 
      className="flex flex-col w-full animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* ── Level 1: Horizontal Roadmap ── */}
      <div className="flex flex-col md:flex-row justify-between relative w-full mb-6">
        {/* Connecting Line Background (Desktop) */}
        <div className="absolute top-[45%] left-8 right-8 h-1 bg-gray-100 dark:bg-[#3A2820] hidden md:block -translate-y-1/2 z-0"></div>

        {/* Connecting Line Background (Mobile) */}
        <div className="absolute top-8 bottom-8 left-[23px] w-1 bg-gray-100 dark:bg-[#3A2820] md:hidden z-0"></div>

        {stages.map((stage, index) => {
          const isCompleted = stage.week < currentStageWeek
          const isCurrent = stage.week === currentStageWeek
          
          let statusText = 'Upcoming'
          let statusColor = 'text-gray-400 dark:text-[#A3938C]'
          let statusPillBg = 'bg-transparent'
          
          if (isCompleted) {
            statusText = 'Completed'
            statusColor = 'text-toneek-forest dark:text-[#4caf82] font-semibold'
          } else if (isCurrent) {
            statusText = 'You are here'
            statusColor = 'text-toneek-amber font-semibold'
          } else {
            const node = nodes.find(n => n.week === stage.week)
            if (node && node.dateText) {
               statusText = node.dateText.replace('Available', 'Opens').replace('Date confirmed on', 'Opens on')
            }
          }

          return (
            <div key={stage.week} className="flex flex-row md:flex-col items-center gap-4 md:gap-2 relative z-10 w-full md:flex-1 py-4 md:py-0">
              
              {/* Active line fill (Desktop) */}
              {isCompleted && index < stages.length - 1 && (
                <div className="absolute top-[45%] left-1/2 w-full h-1 bg-toneek-forest hidden md:block -translate-y-1/2 z-0"></div>
              )}

              {/* Active line fill (Mobile) */}
              {isCompleted && index < stages.length - 1 && (
                <div className="absolute top-1/2 left-[23px] w-1 h-full bg-toneek-forest md:hidden z-0"></div>
              )}

              {/* Top Label (Desktop) */}
              <div className="hidden md:flex flex-col items-center h-6 justify-end w-full">
                <span className="text-[10px] font-bold text-toneek-amber uppercase tracking-widest font-sans whitespace-nowrap">
                  {stage.label}
                </span>
              </div>

              {/* Node Circle */}
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 relative border-[3px] border-white dark:border-[#1A1210] transition-colors ${
                  isCompleted ? 'bg-toneek-forest text-white' :
                  isCurrent ? 'bg-[#2A0F06] dark:bg-[#302420] text-white shadow-[0_0_0_2px_#d4a574]' :
                  'bg-[#E8E0DA] dark:bg-[#261B18] text-gray-400'
                }`}>
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : ''}
                </div>
                {/* Pulsing Dot for Current Stage */}
                {isCurrent && (
                   <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-toneek-amber rounded-full animate-pulse border-2 border-white dark:border-[#1A1210] z-20"></div>
                )}
              </div>

              {/* Mobile Stage Label (Left of circle visually, but using flex row order) */}
              <div className="flex flex-col md:items-center w-full md:w-auto mt-0 md:mt-1">
                <span className="text-[13px] font-bold text-gray-900 dark:text-[#F0E6DF] hidden md:block font-sans">
                  {stage.displayWeek}
                </span>
                
                {/* Mobile specific layout */}
                <div className="flex flex-col md:hidden">
                  <span className="text-[10px] font-bold text-toneek-amber uppercase tracking-widest font-sans mb-0.5">
                    {stage.label}
                  </span>
                  <span className="text-[14px] font-bold text-gray-900 dark:text-[#F0E6DF] font-sans leading-tight">
                    {stage.displayWeek}
                  </span>
                </div>

                <span className={`text-[11px] font-sans mt-1 md:mt-0.5 truncate ${statusColor} ${statusPillBg}`}>
                  {statusText}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Level 3: Detailed Cards (Expandable) ── */}
      <div className="mt-4 pt-6 border-t border-gray-100 dark:border-[#3A2820]">
        <button 
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="flex items-center gap-2 text-[12px] font-semibold text-[#8C7B72] hover:text-[#d4a574] transition-colors mb-2"
        >
          {detailsExpanded ? 'Hide clinical check-in details' : 'View clinical check-in details'}
          {detailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {detailsExpanded && (
          <div className="flex flex-col gap-4 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {nodes.map((node, index) => {
              const isCompleted = node.state === 'COMPLETED'
              const isDue = node.state === 'DUE_NOW'
              const isLocked = node.state === 'LOCKED'

              return (
                <div 
                  key={node.week}
                  className={`border rounded-xl p-5 ${
                    isDue ? 'border-toneek-amber bg-[#FEF9F3] dark:bg-[#2A1C10]' : 
                    'border-gray-100 dark:border-[#3A2820] bg-white dark:bg-[#261B18]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="text-[14px] font-bold text-gray-900 dark:text-[#F0E6DF] font-sans">
                      Week {node.week}
                    </h6>
                    {isCompleted && node.score !== undefined && (
                      <span className="text-[11px] font-bold text-toneek-forest bg-toneek-forest/10 px-2 py-1 rounded">
                        ✓ Score: {node.score}/10
                      </span>
                    )}
                    {isDue && (
                      <span className="text-[11px] font-bold text-white bg-toneek-amber px-2 py-1 rounded animate-pulse">
                        DUE NOW
                      </span>
                    )}
                    {(node.state === 'PENDING' || isLocked) && node.dateText && (
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-[#A3938C]">
                        {node.dateText}
                      </span>
                    )}
                  </div>
                  
                  {node.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-[13px] leading-relaxed">
                      {node.description}
                    </p>
                  )}

                  {node.evidenceNote && (
                    <p className="text-[11px] italic text-[#8C7B72] dark:text-[#6A5A52] font-sans mt-3 border-t border-gray-100 dark:border-[#3A2820] pt-2">
                      {node.evidenceNote}
                    </p>
                  )}
                  
                  {isDue && (
                    <div className="mt-4">
                      <Link 
                        href={`/dashboard/checkin?week=${node.week}`}
                        className="inline-block bg-toneek-amber hover:bg-[#A96429] text-white text-[13px] font-medium px-4 py-2 rounded-md transition-colors shadow-sm w-full text-center sm:w-auto"
                      >
                        Complete Check-in →
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Notes */}
      <div className="mt-4">
        {coldStartNote && (
          <p className="mt-2 text-[11px] text-gray-400 dark:text-[#7A6A62] font-sans italic">
            {coldStartNote}
          </p>
        )}
        {probabilityFooter && (
          <p className="mt-1 text-[11px] text-[#8C7B72] dark:text-[#6A5A52] font-sans italic">
            {probabilityFooter}
          </p>
        )}
      </div>
    </div>
  )
}
