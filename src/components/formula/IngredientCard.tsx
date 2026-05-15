'use client'

import React from 'react'

const INGREDIENT_FUNCTIONS: Record<string, string[]> = {
  'niacinamide': ['✨ Tone Balance', '🧴 Sebum Control', '🔬 Anti-Inflammatory'],
  'centella asiatica': ['🛡️ Barrier Repair', '❄️ Inflammation Calm', '💧 Moisture Support'],
  'azelaic acid': ['⚡ Blemish Control', '✨ Tone Balance', '❄️ Anti-Inflammatory'],
  'tranexamic acid': ['🎯 Pigment Inhibition', '✨ Tone Balance'],
  'salicylic acid': ['🧴 Pore Clearing', '⚡ Exfoliation', '🧴 Sebum Control'],
  'lactic acid': ['💧 Hydration', '⚡ Gentle Exfoliation'],
  'kojic acid': ['✨ Tone Balance', '🎯 Pigment Inhibition'],
  'ceramide': ['🛡️ Barrier Repair', '💧 Moisture Retention'],
  'hyaluronic acid': ['💧 Deep Hydration', '🛡️ Barrier Support'],
  'squalane': ['🛡️ Lipid Replenishment', '💧 Moisture Seal'],
  'panthenol': ['🛡️ Barrier Repair', '❄️ Inflammation Calm', '💧 Moisture Support'],
  'vitamin c': ['✨ Brightening', '🛡️ Antioxidant', '🔬 Collagen Support'],
  'alpha arbutin': ['🎯 Pigment Inhibition', '✨ Tone Balance'],
  'glycolic acid': ['⚡ Exfoliation', '✨ Tone Balance', '🔬 Cell Renewal'],
  'bakuchiol': ['🔬 Collagen Support', '❄️ Anti-Inflammatory', '⚡ Renewal'],
  'retinol': ['🔬 Cell Renewal', '🔬 Collagen Support', '✨ Tone Balance'],
  'mandelic acid': ['⚡ Gentle Exfoliation', '✨ Tone Balance'],
  'succinic acid': ['⚡ Blemish Control', '🧴 Sebum Control'],
}

function getIngredientBadges(name: string, rationale: string) {
  const normalizedName = name.toLowerCase().trim()
  
  // Exact match
  if (INGREDIENT_FUNCTIONS[normalizedName]) {
    return INGREDIENT_FUNCTIONS[normalizedName]
  }
  
  // Partial match
  for (const [key, badges] of Object.entries(INGREDIENT_FUNCTIONS)) {
    if (normalizedName.includes(key)) return badges
  }
  
  // Fallback generation based on rationale keywords
  const fallbackBadges = []
  const r = rationale.toLowerCase()
  if (r.includes('barrier')) fallbackBadges.push('🛡️ Barrier Support')
  if (r.includes('inflam') || r.includes('calm') || r.includes('sooth')) fallbackBadges.push('❄️ Inflammation Calm')
  if (r.includes('tone') || r.includes('bright') || r.includes('pigment')) fallbackBadges.push('✨ Tone Balance')
  if (r.includes('hydrat') || r.includes('moist')) fallbackBadges.push('💧 Moisture Support')
  if (r.includes('oil') || r.includes('sebum')) fallbackBadges.push('🧴 Sebum Control')
  if (r.includes('clear') || r.includes('acne') || r.includes('blemish')) fallbackBadges.push('⚡ Blemish Control')

  if (fallbackBadges.length > 0) return fallbackBadges.slice(0, 3)

  return ['🔬 Active System Component']
}

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
      {/* Function Badges */}
      <div className="flex flex-wrap gap-2 mt-3 mb-4">
        {getIngredientBadges(name, rationale).map((badge, i) => (
          <span 
            key={i} 
            className="text-[10px] font-sans font-semibold text-toneek-amber bg-toneek-amber/15 px-2 py-1 rounded-[4px]"
          >
            {badge}
          </span>
        ))}
      </div>      {/* Concentration Visual Bar */}
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
