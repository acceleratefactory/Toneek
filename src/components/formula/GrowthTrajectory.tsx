'use client'

import React from 'react'

interface GrowthTrajectoryProps {
  currentScore: number
  latestWeek?: number
}

export default function GrowthTrajectory({ currentScore, latestWeek = 0 }: GrowthTrajectoryProps) {
  const baseline = 50
  const target = 85
  const isTargetReached = currentScore >= target

  return (
    <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-[#3A2820]">
      {/* Baseline */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex justify-between text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans px-1">
          <span>Baseline (Week 0)</span>
          <span>{baseline}</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-[#3A2820] rounded-md h-[22px]">
          <div className="bg-gray-300 dark:bg-[#5C4D44] h-full rounded-md" style={{ width: `${baseline}%` }} />
        </div>
      </div>

      {/* Current */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex justify-between text-[11px] font-bold text-toneek-amber uppercase tracking-widest font-sans px-1">
          <span>Current (Week {latestWeek})</span>
          <span>{currentScore}</span>
        </div>
        <div className="w-full bg-[#FEF9F3] dark:bg-[#2A1C10] rounded-md h-[22px] border border-toneek-amber/20 overflow-hidden relative">
          <div 
            className="bg-gradient-to-r from-toneek-amber/80 to-toneek-amber h-full rounded-r-md transition-all duration-1000 ease-out" 
            style={{ width: `${currentScore}%` }}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>

      {/* Target */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex justify-between text-[11px] font-bold text-toneek-forest uppercase tracking-widest font-sans px-1">
          <span>Target Core Stability</span>
          <span>{target}</span>
        </div>
        <div className={`w-full bg-[#F2FAF5] dark:bg-[#1A2E20] rounded-md h-[22px] overflow-hidden ${!isTargetReached ? 'border border-dashed border-toneek-forest/40' : 'border border-toneek-forest/40'}`}>
          <div 
            className={`h-full transition-all duration-1000 ease-out ${!isTargetReached ? 'bg-toneek-forest/20' : 'bg-toneek-forest/90'}`} 
            style={{ width: `${target}%` }} 
          />
        </div>
      </div>
    </div>
  )
}
