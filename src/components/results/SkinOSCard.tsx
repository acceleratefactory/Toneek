'use client'

import React, { useRef } from 'react'
import domtoimage from 'dom-to-image-more'

export function getScoreMeaning(score: number): string {
  if (score >= 80) return 'Strong baseline'
  if (score >= 65) return 'Good foundation, targeted correction needed'
  if (score >= 50) return 'Recoverable — targeted correction needed'
  if (score >= 35) return 'Your skin needs clinical attention'
  return 'Significant correction required'
}

export function getCuriosityHook(primary_concern: string): string {
  const hooks: Record<string, string> = {
    PIH: 'Your dark marks need more than a brightening serum',
    tone: 'Your skin tone issue has a clinical cause',
    acne: 'Your breakouts are leaving marks that need a second formula',
    dryness: 'Your moisturiser may not be reaching your barrier',
    sensitivity: 'Your skin is reacting to something your routine is missing',
    oiliness: 'Your oil control routine may be making things worse',
    texture: 'Your texture has a clinical cause most brands miss',
  }
  return hooks[primary_concern] ?? 'Your skincare might not be working'
}

interface SkinOSCardProps {
  score: number
  formulaCode: string
  metrics: string[] // Top critical metrics
  primaryConcern: string
  referralCode?: string
}

export default function SkinOSCard({ score, formulaCode, metrics, primaryConcern, referralCode }: SkinOSCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleShare = async () => {
    if (!cardRef.current) return

    try {
      // Ensure all fonts are loaded before capture
      await document.fonts.ready

      // Use dom-to-image-more — handles Tailwind v4 oklch/lab colors natively
      // html2canvas cannot parse modern CSS color functions
      const targetWidth = 1080
      const currentWidth = cardRef.current.offsetWidth
      const scale = targetWidth / currentWidth

      const blob = await domtoimage.toBlob(cardRef.current, {
        quality: 1,
        scale: scale,
        bgcolor: '#2A0F06',
      })

      const file = new File([blob], `Toneek-SkinOS-${formulaCode}.png`, { type: 'image/png' })

      // Attempt native mobile share sheet
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Toneek Skin OS Score',
          text: `My Skin OS Score is ${score} on Toneek. Find yours → ${referralCode ? `toneek.com/ref/${referralCode}` : 'toneek.com'}`,
          files: [file],
        })
      } else {
        // Fallback to desktop download
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Toneek-SkinOS-${formulaCode}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('[SkinOS Card] Image generation failed:', err)
      alert('Could not generate the image. Please try again.')
    }
  }

  return (
    <div 
      className="flex flex-col items-center mt-12 mx-auto"
      style={{ width: 'min(340px, calc(100vw - 48px))' }}
    >
      {/* The Visual Card Container */}
      <div 
        id="skinos-card"
        ref={cardRef} 
        className="w-full aspect-square bg-[#2A0F06] rounded-[32px] p-8 flex flex-col justify-between relative shadow-xl overflow-hidden border border-[#EDA211]/20"
      >
        {/* Top Row: Hexagon Icon & Formula Code */}
        <div className="flex justify-between items-start z-10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EDA211" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <div className="text-right">
            <p className="text-[#EADECE] text-[10px] uppercase tracking-[0.2em] opacity-70 font-semibold mb-1">Formula</p>
            <p className="text-[#EDA211] font-bold tracking-widest text-lg">{formulaCode}</p>
          </div>
        </div>

        {/* Center: Skin OS Score */}
        <div className="text-center flex flex-col items-center justify-center flex-grow z-10">
          <p className="text-[#EADECE] text-[10px] uppercase tracking-[0.2em] mb-4 font-semibold opacity-90">This is my Skin Score</p>
          <h2 className="text-[#EDA211] text-[72px] font-black tabular-nums leading-none mb-2 drop-shadow-lg" style={{ fontFamily: 'Fraunces, serif' }}>{score}</h2>
          <p className="text-[#EADECE] text-xs font-medium opacity-80 mb-6">{getScoreMeaning(score)}</p>
          
          {/* Top Metrics */}
          <div className="flex flex-wrap justify-center gap-[6px] px-2 max-w-full">
            {metrics.slice(0, 4).map((m, i) => (
              <span key={i} className="px-[10px] py-[4px] rounded-[20px] text-[#F7F1EB] text-[10px] font-semibold uppercase tracking-[1px] bg-[rgba(255,255,255,0.12)] whitespace-nowrap">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Area: Curiosity Hook & Branding */}
        <div className="flex flex-col z-10 mt-2">
          <p className="text-[#EADECE] text-[11px] font-medium opacity-70 mb-4 max-w-[85%]">{getCuriosityHook(primaryConcern)}</p>
          
          <div className="flex justify-between items-end border-t border-[#EADECE]/10 pt-4">
            <div>
              <p className="text-[#EDA211] text-[10px] font-bold tracking-wide mb-0.5">Find out what your skin actually needs</p>
              <p className="text-[#EADECE] text-[10px] opacity-50 font-medium">
                {referralCode ? `toneek.com/ref/${referralCode}` : 'toneek.com'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#EADECE] text-sm font-bold tracking-widest mb-1">TONEEK</p>
              <p className="text-[#EADECE] text-[10px] opacity-70 tracking-wider font-medium flex items-center justify-end gap-1">
                Compare yours <span className="text-[#EDA211]">→</span>
              </p>
            </div>
          </div>
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
