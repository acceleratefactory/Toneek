'use client'

import React, { useState, useEffect } from 'react'

interface CheckinCountdownTimerProps {
  hasReceived: boolean
  nextCheckinWeek: number | null
  nextCheckinDate: Date | null
}

export default function CheckinCountdownTimer({
  hasReceived,
  nextCheckinWeek,
  nextCheckinDate,
}: CheckinCountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)

  useEffect(() => {
    if (!hasReceived || !nextCheckinDate) return

    const calculateTimeLeft = () => {
      const difference = nextCheckinDate.getTime() - new Date().getTime()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        // Time is up, page should theoretically reload or unlock
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [hasReceived, nextCheckinDate])

  if (!hasReceived) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-toneek-amber/20 rounded-xl p-8 text-center shadow-sm max-w-2xl mx-auto">
        <h2 className="text-toneek-brown dark:text-[#F0E6DF] text-xl font-bold mb-3 font-sans">
          Log Your Delivery
        </h2>
        <p className="text-gray-600 dark:text-[#A3938C] text-sm mb-6 leading-relaxed">
          Your check-in timeline hasn't started yet. Your clinical countdown will automatically begin the exact moment you confirm you've received your product.
        </p>
        <a href="/dashboard" className="inline-block px-6 py-3 bg-[#E8E0DA] dark:bg-[#3A2820] text-toneek-brown dark:text-[#F0E6DF] rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
          Return to Dashboard
        </a>
      </div>
    )
  }

  if (!nextCheckinWeek || !nextCheckinDate) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-toneek-amber/20 rounded-xl p-8 text-center shadow-sm max-w-2xl mx-auto">
        <h2 className="text-toneek-brown dark:text-[#F0E6DF] text-xl font-bold mb-3 font-sans">
          Protocol Complete
        </h2>
        <p className="text-gray-600 dark:text-[#A3938C] text-sm mb-6 leading-relaxed">
          You have successfully completed all scheduled check-ins for this protocol.
        </p>
        <a href="/dashboard/formula" className="inline-block px-6 py-3 bg-[#E8E0DA] dark:bg-[#3A2820] text-toneek-brown dark:text-[#F0E6DF] rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
          Return to Dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#3A2820] rounded-xl p-8 text-center shadow-[0_4px_20px_rgba(42,15,6,0.04)] max-w-2xl mx-auto animate-fade-in relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-toneek-amber/5 to-transparent pointer-events-none" />

      <h2 className="text-[11px] font-bold text-toneek-amber uppercase tracking-widest font-sans mb-3">
        Next Milestone: Week {nextCheckinWeek}
      </h2>
      <h3 className="text-toneek-brown dark:text-[#F0E6DF] text-2xl font-bold mb-2 font-serif">
        Your Check-in Opens In
      </h3>
      <p className="text-gray-500 dark:text-[#A3938C] text-sm mb-8 font-sans">
        Stay consistent with your protocol. This assessment will track your progress against your baseline.
      </p>

      {timeLeft ? (
        <div className="flex justify-center items-center gap-4 mb-10">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FAF8F5] dark:bg-[#261B18] border border-gray-200 dark:border-[#3A2820] rounded-xl flex items-center justify-center mb-2 shadow-inner">
              <span className="text-2xl sm:text-3xl font-bold text-toneek-brown dark:text-[#F0E6DF] font-mono">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Days</span>
          </div>
          <span className="text-2xl font-bold text-gray-300 dark:text-[#3A2820] pb-6">:</span>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FAF8F5] dark:bg-[#261B18] border border-gray-200 dark:border-[#3A2820] rounded-xl flex items-center justify-center mb-2 shadow-inner">
              <span className="text-2xl sm:text-3xl font-bold text-toneek-brown dark:text-[#F0E6DF] font-mono">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hrs</span>
          </div>
          <span className="text-2xl font-bold text-gray-300 dark:text-[#3A2820] pb-6">:</span>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FAF8F5] dark:bg-[#261B18] border border-gray-200 dark:border-[#3A2820] rounded-xl flex items-center justify-center mb-2 shadow-inner">
              <span className="text-2xl sm:text-3xl font-bold text-toneek-brown dark:text-[#F0E6DF] font-mono">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Min</span>
          </div>
        </div>
      ) : (
        <div className="h-[120px] mb-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-toneek-amber/30 border-t-toneek-amber rounded-full animate-spin"></div>
        </div>
      )}

      <a href="/dashboard/formula" className="inline-block px-8 py-3.5 bg-toneek-brown dark:bg-[#E8DDD8] text-white dark:text-[#1A1210] rounded-xl font-bold text-[13px] tracking-wide hover:opacity-90 transition-all shadow-md">
        Review Your Formula
      </a>
    </div>
  )
}
