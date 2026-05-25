'use client'

import React, { useRef } from 'react'
import html2canvas from 'html2canvas'

interface SkinOSCardProps {
  score: number
  formulaCode: string
  metrics: string[] // Top critical metrics
}

export default function SkinOSCard({ score, formulaCode, metrics }: SkinOSCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleShare = async () => {
    if (!cardRef.current) return

    try {
      // Calculate perfect 1080x1080 scaling regardless of phone screen size
      const targetWidth = 1080
      const currentWidth = cardRef.current.offsetWidth
      const scale = targetWidth / currentWidth

      const canvas = await html2canvas(cardRef.current, {
        scale: scale,
        backgroundColor: '#2A0F06', // deep brown
        useCORS: true,
      })

      const dataUrl = canvas.toDataURL('image/png')
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `Toneek-SkinOS-${formulaCode}.png`, { type: 'image/png' })

      // Attempt native mobile share sheet
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Toneek Skin OS Score',
          text: `My Toneek Skin OS Score is ${score}. Formula: ${formulaCode}`,
          files: [file],
        })
      } else {
        // Fallback to desktop download
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `Toneek-SkinOS-${formulaCode}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      console.error('Error sharing image:', err)
      alert('Could not generate the image. Please try again.')
    }
  }

  return (
    <div className="flex flex-col items-center mt-12 w-full max-w-sm mx-auto">
      
      {/* The Visual Card Container */}
      <div 
        ref={cardRef} 
        className="w-full aspect-square bg-[#2A0F06] rounded-[32px] p-8 flex flex-col justify-between relative shadow-xl overflow-hidden border border-[#EDA211]/20"
      >
        {/* Top Row: Hexagon Icon & Formula Code */}
        <div className="flex justify-between items-start z-10">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EDA211" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <div className="text-right">
            <p className="text-[#EADECE] text-[10px] uppercase tracking-[0.2em] opacity-70 font-semibold mb-1">Formula</p>
            <p className="text-[#EDA211] font-bold tracking-widest text-lg">{formulaCode}</p>
          </div>
        </div>

        {/* Center: Skin OS Score */}
        <div className="text-center flex flex-col items-center justify-center flex-grow z-10">
          <p className="text-[#EADECE] text-xs uppercase tracking-[0.2em] mb-3 font-semibold opacity-90">Skin OS Score</p>
          <h2 className="text-[#EDA211] text-8xl font-black tabular-nums leading-none mb-6 drop-shadow-lg">{score}</h2>
          
          {/* 3 Metric Labels */}
          <div className="flex flex-wrap justify-center gap-2 mt-2 px-4">
            {metrics.map((m, i) => (
              <span key={i} className="px-4 py-1.5 rounded-full border border-[#EDA211]/30 text-[#EADECE] text-[11px] font-bold uppercase tracking-wider bg-[#EDA211]/10">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Row: Branding */}
        <div className="flex justify-between items-end border-t border-[#EADECE]/10 pt-5 z-10">
          <p className="text-[#EADECE] text-sm font-bold tracking-widest">TONEEK</p>
          <p className="text-[#EADECE] text-xs opacity-60 tracking-wider font-medium">toneek.com</p>
        </div>
      </div>

      {/* Share CTA Button */}
      <button 
        onClick={handleShare}
        className="mt-6 flex items-center justify-center gap-2 bg-[#EDA211] text-[#2A0F06] font-bold py-3.5 px-8 rounded-full w-full hover:bg-[#EADECE] hover:scale-[1.02] transition-all shadow-lg shadow-[#EDA211]/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Share your results
      </button>
    </div>
  )
}
