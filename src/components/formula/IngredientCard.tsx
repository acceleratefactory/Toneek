'use client'

import React from 'react'

interface IngredientProps {
  name: string
  role: string          // e.g. BRIGHTENING, RENEWAL
  concentration: number // actual percentage e.g. 5
  maxSafeLimit: number  // the absolute max safe percentage e.g. 10
  rationale: string     // e.g. "To fade hyperpigmentation without irritation"
  delayMs?: number      // optional stagger delay for the reveal
}

export default function IngredientCard({
  name,
  role,
  concentration,
  maxSafeLimit,
  rationale,
  delayMs = 0
}: IngredientProps) {
  // Calculate width relative to max clinical limit
  const widthPercentage = Math.min((concentration / maxSafeLimit) * 100, 100)

  return (
    <div 
      className="bg-white dark:bg-[#261B18] border-l-4 border-toneek-amber rounded-lg shadow-sm p-4 relative animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex justify-between items-start mb-1">
        <div>
          {/* Role Pill */}
          <span className="inline-block bg-gray-100 dark:bg-[#3A2820] text-gray-500 dark:text-gray-400 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 font-semibold">
            {role}
          </span>
          <h4 className="text-gray-900 dark:text-[#F0E6DF] font-semibold text-base font-sans">
            {name}
          </h4>
        </div>
        
        {/* Concentration Badge */}
        <span className="bg-toneek-amber text-white text-xs font-bold px-2 py-1 rounded-md">
          {concentration}%
        </span>
      </div>
      
      <p className="text-gray-500 dark:text-[#A3938C] text-sm leading-snug mb-4 font-sans pr-8">
        {rationale}
      </p>

      {/* Concentration Visual Bar */}
      <div className="w-full h-1.5 bg-gray-100 dark:bg-[#3A2820] rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-toneek-amber/60 to-toneek-amber rounded-full"
          style={{ 
            '--bar-width': `${widthPercentage}%`,
            animation: `barGrow 0.8s ease-out ${delayMs + 200}ms forwards`
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
