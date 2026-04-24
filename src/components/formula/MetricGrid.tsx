'use client'

import React from 'react'
import AnimatedScoreRing from './AnimatedScoreRing'

interface MetricGridProps {
  assessment: any // Pass the raw skin_assessments row
  delayMs?: number
}

export default function MetricGrid({ assessment, delayMs = 0 }: MetricGridProps) {
  // 1. BARRIER HEALTH
  let barrierScore = 100
  if (assessment?.bleaching_history === 'Yes, currently bleaching') barrierScore -= 40
  else if (assessment?.bleaching_history === 'Yes, in the past 12 months') barrierScore -= 25
  else if (assessment?.bleaching_history === 'Yes, but more than a year ago') barrierScore -= 10
  
  if (assessment?.barrier_sensitive) barrierScore -= 15
  
  const triggers = assessment?.triggers || []
  if (triggers.includes('products_trigger')) barrierScore -= 10
  
  if (assessment?.current_product_count === '6 or more') barrierScore -= 5

  barrierScore = Math.max(0, barrierScore)

  let barrierLabel = "Strong"
  if (barrierScore < 40) barrierLabel = "Damaged"
  else if (barrierScore < 60) barrierLabel = "Compromised"
  else if (barrierScore < 80) barrierLabel = "Moderate"

  // 2. TREATMENT READINESS
  const riskScore = assessment?.risk_score || 0
  const confidenceScore = assessment?.confidence_score || 0.8
  let readinessScore = (1 - riskScore) * 100
  readinessScore = readinessScore * confidenceScore

  const formulaTier = assessment?.formula_tier || 'standard'
  if (formulaTier === 'conservative') readinessScore *= 0.7
  else if (formulaTier === 'standard') readinessScore *= 0.85
  
  readinessScore = Math.min(100, Math.max(0, Math.round(readinessScore)))

  let readinessLabel = "High"
  if (readinessScore < 40) readinessLabel = "Fragile"
  else if (readinessScore < 60) readinessLabel = "Cautious"
  else if (readinessScore < 80) readinessLabel = "Moderate"

  // 3. CLIMATE ADAPTATION
  let climateScore = 100
  if (assessment?.years_in_current_location === 'Less than 1 year') climateScore -= 20
  
  const climateTransitions = assessment?.climate_transition_effects || []
  climateScore -= (climateTransitions.length * 15)

  const zone = assessment?.climate_zone || ''
  if (zone.toLowerCase().includes('equatorial') || zone.toLowerCase().includes('cold')) {
    climateScore -= 5
  }

  climateScore = Math.max(0, Math.round(climateScore))

  let climateLabel = "Well adapted"
  if (climateScore < 40) climateLabel = "Adjusting"
  else if (climateScore < 60) climateLabel = "Transitioning"
  else if (climateScore < 80) climateLabel = "Adapting"

  // 4. DATA CONFIDENCE
  const dataConfidence = Math.round((assessment?.confidence_score || 0.75) * 100)
  
  let dataLabel = "High confidence"
  if (dataConfidence < 60) dataLabel = "Building"
  else if (dataConfidence < 80) dataLabel = "Moderate"
  else if (dataConfidence < 90) dataLabel = "Good"

  const metrics = [
    { title: "BARRIER HEALTH", score: barrierScore, label: barrierLabel },
    { title: "TREATMENT READY", score: readinessScore, label: readinessLabel },
    { title: "CLIMATE ADAPT", score: climateScore, label: climateLabel },
    { title: "DATA CONFIDENCE", score: dataConfidence, label: dataLabel }
  ]

  return (
    <div 
      className="grid grid-cols-2 gap-4 animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {metrics.map((metric, i) => (
        <div key={metric.title} className="bg-white dark:bg-[#261B18] border border-gray-100 dark:border-[#3A2820] shadow-sm rounded-xl p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 hover:border-toneek-amber/30 transition-colors">
          <div className="flex-shrink-0">
            <AnimatedScoreRing 
              score={metric.score} 
              size={56} /* Slightly smaller for compactness, visually 72px area */
              strokeWidth={5} 
              showLabel={false}
              delay={delayMs + (i * 100)}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h5 className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest mb-1 font-sans">
              {metric.title}
            </h5>
            <p className="text-[13px] sm:text-[14px] font-medium text-toneek-brown dark:text-[#F0E6DF] font-sans">
              {metric.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
