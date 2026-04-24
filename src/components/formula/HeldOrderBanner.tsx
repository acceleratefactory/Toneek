'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface HeldOrderBannerProps {
  checkinWeekRequired: number
}

export default function HeldOrderBanner({ checkinWeekRequired }: HeldOrderBannerProps) {
  return (
    <div className="bg-[#FEF3E2] border-l-4 border-[#D4700A] p-4 mb-8 shadow-sm flex items-start gap-4 animate-slide-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
      <div className="text-[#D4700A] mt-0.5 flex-shrink-0">
        <AlertCircle size={20} />
      </div>
      <div>
        <h4 className="text-[#964B00] font-bold text-sm mb-1 font-sans">
          Action Required: Order Held
        </h4>
        <p className="text-[#8C4A00] text-sm leading-snug font-medium">
          Your next formula shipment is ready but requires your Week {checkinWeekRequired} check-in data to proceed. 
          Complete the check-in below to immediately release your order.
        </p>
      </div>
    </div>
  )
}
