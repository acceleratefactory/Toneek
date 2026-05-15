// src/components/formula/EscalationPath.tsx
// Standalone escalation path card for /dashboard/formula only.
// Extracted from CheckinTimeline Week 8 node — now a prominent separate card.
// Placed below the Clinical Check-in Schedule card.
// Static content — no props needed beyond optional delay.
// Design: numbered steps with deep brown circle indicators,
// amber closing line. Per toneek_clinical_os_final_upgrade.md.

interface EscalationPathProps {
  formulaTier?: string
  delayMs?: number
}

const TIERS = [
  { id: 'standard', label: 'Tier 1: Base Correction' },
  { id: 'tier_2', label: 'Tier 2: Deeper Renewal' },
  { id: 'tier_3', label: 'Tier 3: Stubborn Marks' },
  { id: 'referral', label: 'Tier 4: Clinical Referral' },
]

export default function EscalationPath({ formulaTier = 'standard', delayMs = 0 }: EscalationPathProps) {
  // Normalize formula tier
  const tierMap: Record<string, number> = {
    'standard': 0,
    'tier_2': 1,
    'tier_3': 2,
    'referral': 3
  }
  const currentIndex = tierMap[formulaTier] ?? 0

  return (
    <div
      className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl p-6 sm:p-8 shadow-sm animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-1">
        Your Escalation Path
      </p>
      <p className="text-[13px] text-gray-500 dark:text-[#A3938C] font-sans mb-8 leading-snug">
        The system adapts when results plateau.
      </p>

      <div className="flex flex-col relative pl-2">
        {TIERS.map((tier, i) => {
          const isCompleted = i < currentIndex
          const isCurrent = i === currentIndex
          const isLocked = i > currentIndex
          
          let statusLabel = 'LOCKED'
          let colorClass = 'text-gray-500 dark:text-[#7A6A62] opacity-60'
          let nodeClass = 'bg-[#E8E0DA] dark:bg-[#3A2820] text-gray-500'
          
          if (isCompleted) {
             statusLabel = 'COMPLETED'
             colorClass = 'text-gray-900 dark:text-[#D4C5BE] opacity-80'
             nodeClass = 'bg-toneek-forest text-white border-2 border-white dark:border-[#1A1210]'
          } else if (isCurrent) {
             statusLabel = 'CURRENT'
             colorClass = 'text-[#2A0F06] dark:text-[#F0E6DF] font-bold'
             nodeClass = 'bg-[#2A0F06] dark:bg-[#302420] text-white shadow-[0_0_0_2px_#d4a574] border-2 border-white dark:border-[#1A1210]'
          }

          return (
            <div key={tier.id} className="flex items-start gap-5 relative mb-8 last:mb-0">
               {/* Vertical Connecting Line to NEXT node */}
               {i < TIERS.length - 1 && (
                  <div className={`absolute left-[13px] top-[30px] w-1 bottom-[-32px] z-0 ${isCompleted ? 'bg-toneek-amber/60' : 'bg-[#E8E0DA] dark:bg-[#3A2820]'}`}></div>
               )}
               
               <div className="relative z-10 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${nodeClass}`}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  {isCurrent && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-toneek-amber rounded-full animate-pulse border-2 border-white dark:border-[#1A1210] z-20"></div>
                  )}
               </div>

               <div className={`flex flex-col pt-1 ${colorClass}`}>
                  <span className="text-[14px] font-sans leading-none">
                    {tier.label}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 ${isCurrent ? 'text-toneek-amber' : isCompleted ? 'text-toneek-forest/80' : 'text-gray-400'}`}>
                    {statusLabel}
                  </span>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
