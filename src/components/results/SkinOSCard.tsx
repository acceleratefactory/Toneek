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
  metrics: string[]
  primaryConcern: string
  referralCode?: string
}

export default function SkinOSCard({ score, formulaCode, metrics, primaryConcern, referralCode }: SkinOSCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleShare = async () => {
    if (!cardRef.current) return

    try {
      await document.fonts.ready

      const targetWidth = 1080
      const currentWidth = cardRef.current.offsetWidth
      const scale = targetWidth / currentWidth

      const blob = await domtoimage.toBlob(cardRef.current, {
        quality: 1,
        scale: scale,
        bgcolor: '#2A0F06',
      })

      const file = new File([blob], `Toneek-SkinOS-${formulaCode}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Toneek Skin OS Score',
          text: `My Skin OS Score is ${score} on Toneek. Find yours → ${referralCode ? `toneek.com/ref/${referralCode}` : 'toneek.com'}`,
          files: [file],
        })
      } else {
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

  const ctaLink = referralCode ? `toneek.com/ref/${referralCode}` : 'toneek.com'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '48px',
      width: 'min(340px, calc(100vw - 48px))',
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>

      {/*
        THE CARD — all inline styles only.
        Tailwind classes are intentionally removed from the card interior.
        dom-to-image-more uses SVG foreignObject which does not load the
        Tailwind CSS bundle. Tailwind's global reset sets border-style: solid
        on every element, causing visible borders in the captured image.
        Pure inline styles eliminate this CSS pollution entirely.
      */}
      <div
        id="skinos-card"
        ref={cardRef}
        style={{
          width: '100%',
          backgroundColor: '#2A0F06',
          borderRadius: '28px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(237,162,17,0.2)',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Row: Hexagon Icon & Formula Code */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '18px',
        }}>
          <svg
            width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="#EDA211" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              color: '#EADECE',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              opacity: 0.7,
              fontWeight: 600,
              margin: '0 0 4px 0',
              fontFamily: 'Arial, sans-serif',
              padding: 0,
              border: 'none',
            }}>Formula</p>
            <p style={{
              color: '#EDA211',
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontSize: '15px',
              margin: 0,
              padding: 0,
              fontFamily: 'Arial, sans-serif',
              whiteSpace: 'nowrap',
              border: 'none',
            }}>{formulaCode}</p>
          </div>
        </div>

        {/* Center: Title, Score, Score Meaning, Metrics */}
        <div style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '18px',
        }}>
          <p style={{
            color: '#EADECE',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontWeight: 600,
            opacity: 0.9,
            margin: '0 0 10px 0',
            padding: 0,
            border: 'none',
            fontFamily: 'Arial, sans-serif',
          }}>This is my Skin Score</p>

          <h2 style={{
            color: '#EDA211',
            fontSize: '68px',
            fontWeight: 900,
            lineHeight: 1,
            margin: '0 0 8px 0',
            padding: 0,
            border: 'none',
            fontFamily: 'Fraunces, Georgia, serif',
            fontVariantNumeric: 'tabular-nums',
          }}>{score}</h2>

          <p style={{
            color: '#EADECE',
            fontSize: '12px',
            fontWeight: 500,
            opacity: 0.8,
            margin: '0 0 16px 0',
            padding: 0,
            border: 'none',
            fontFamily: 'Arial, sans-serif',
          }}>{getScoreMeaning(score)}</p>

          {/* Metric Pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '6px',
            maxWidth: '100%',
          }}>
            {metrics.slice(0, 4).map((m, i) => (
              <span key={i} style={{
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#F7F1EB',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
                fontFamily: 'Arial, sans-serif',
                border: 'none',
              }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Area: Curiosity Hook & Branding */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{
            color: '#EADECE',
            fontSize: '11px',
            fontWeight: 500,
            opacity: 0.7,
            margin: '0 0 14px 0',
            padding: 0,
            border: 'none',
            maxWidth: '85%',
            fontFamily: 'Arial, sans-serif',
          }}>{getCuriosityHook(primaryConcern)}</p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid rgba(234,222,206,0.1)',
            paddingTop: '14px',
          }}>
            <div>
              <p style={{
                color: '#EDA211',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                margin: '0 0 2px 0',
                padding: 0,
                border: 'none',
                fontFamily: 'Arial, sans-serif',
              }}>Find out what your skin actually needs</p>
              <p style={{
                color: '#EADECE',
                fontSize: '10px',
                opacity: 0.5,
                fontWeight: 500,
                margin: 0,
                padding: 0,
                border: 'none',
                fontFamily: 'Arial, sans-serif',
              }}>{ctaLink}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{
                color: '#EADECE',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                margin: '0 0 4px 0',
                padding: 0,
                border: 'none',
                fontFamily: 'Arial, sans-serif',
              }}>TONEEK</p>
              <p style={{
                color: '#EADECE',
                fontSize: '10px',
                opacity: 0.7,
                margin: 0,
                padding: 0,
                border: 'none',
                fontFamily: 'Arial, sans-serif',
              }}>
                Compare yours <span style={{ color: '#EDA211' }}>→</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Share CTA Button — outside the card, Tailwind is fine here */}
      <button
        onClick={handleShare}
        className="mt-6 flex items-center justify-center gap-2 bg-[#EDA211] text-[#2A0F06] font-bold py-3.5 px-8 rounded-full w-full hover:bg-[#EADECE] hover:scale-[1.02] transition-all shadow-lg shadow-[#EDA211]/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share your results
      </button>
    </div>
  )
}
