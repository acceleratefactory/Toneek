import React from 'react'
import { MapPin, Droplets, Sun, Wind, ThermometerSun } from 'lucide-react'

interface FormulaCardProps {
  formulaCode: string
  formulaName: string
  climateZone: string
  pathPills: string[] // e.g. ["Lagos", "Dry", "Dryness"]
  delayMs?: number
}

export default function FormulaCard({
  formulaCode,
  formulaName,
  climateZone,
  pathPills,
  delayMs = 0
}: FormulaCardProps) {
  
  // Choose an icon based on climate zone keywords
  let ClimateIcon = ThermometerSun
  if (climateZone.toLowerCase().includes('humid')) ClimateIcon = Droplets
  if (climateZone.toLowerCase().includes('dry') || climateZone.toLowerCase().includes('arid')) ClimateIcon = Sun
  if (climateZone.toLowerCase().includes('cold')) ClimateIcon = Wind

  return (
    <div 
      className="bg-white dark:bg-[#1A1210] border border-gray-100 dark:border-[#3A2820] shadow-sm rounded-xl p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex-1">
        <h5 className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest mb-2 font-sans">
          Your Formula
        </h5>
        <div className="text-3xl sm:text-4xl font-bold font-mono text-toneek-brown dark:text-[#F0E6DF] tracking-tight mb-1">
          {formulaCode}
        </div>
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200 font-sans mb-4">
          {formulaName}
        </p>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#A3938C] bg-gray-50 dark:bg-[#261B18] px-3 py-2 rounded-lg inline-flex">
          <ClimateIcon size={16} className="text-toneek-amber" />
          <span>Formulated for {climateZone}</span>
        </div>
      </div>

      <div className="md:border-l md:border-gray-100 dark:md:border-[#3A2820] md:pl-8 flex flex-col">
        <h5 className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest mb-3 font-sans">
          Why this formula
        </h5>
        
        <div className="flex flex-row items-center flex-wrap">
          {pathPills.map((pill, index) => (
            <React.Fragment key={pill}>
              <div className="bg-toneek-amber text-white text-[13px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm">
                {pill}
              </div>
              {index < pathPills.length - 1 && (
                <div className="w-4 sm:w-6 h-[2px] bg-toneek-amber/30 shrink-0"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
