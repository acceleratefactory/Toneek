// src/components/formula/EscalationPath.tsx
// Standalone escalation path card for /dashboard/formula only.
// Extracted from CheckinTimeline Week 8 node — now a prominent separate card.
// Placed below the Clinical Check-in Schedule card.
// Static content — no props needed beyond optional delay.
// Design: numbered steps with deep brown circle indicators,
// amber closing line. Per toneek_clinical_os_final_upgrade.md.

interface EscalationPathProps {
  delayMs?: number
}

const STEPS = [
  'Current protocol continues',
  'Active concentrations adjusted upward',
  'Two-step protocol introduced (exfoliant + treatment)',
  'Dermatology bridge referral',
]

export default function EscalationPath({ delayMs = 0 }: EscalationPathProps) {
  return (
    <div
      className="bg-white dark:bg-[#1A1210] border border-[#E8E0DA] dark:border-[#3A2820] rounded-xl p-6 sm:p-8 shadow-sm animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-1">
        System Escalation Path
      </p>
      <p className="text-[13px] text-gray-500 dark:text-[#A3938C] font-sans mb-5">
        The system adapts when results plateau.<br />
        If Week 8 shows insufficient improvement:
      </p>

      {/* Numbered steps */}
      <div className="flex flex-col gap-0">
        {STEPS.map((step, i) => (
          <div key={i}>
            <div className="flex items-start gap-4 py-3">
              {/* Deep brown circle number indicator */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#2A0F06] dark:bg-[#3D1A0E] flex items-center justify-center mt-0.5">
                <span className="text-white text-[11px] font-bold font-mono">
                  {i + 1}
                </span>
              </div>
              <p className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-sans leading-snug pt-1">
                {step}
              </p>
            </div>
            {/* Divider between steps — not after last */}
            {i < STEPS.length - 1 && (
              <div className="ml-[1.375rem] border-t border-[#F0EAE4] dark:border-[#2A1C14]" />
            )}
          </div>
        ))}
      </div>

      {/* Amber closing line */}
      <p className="text-[13px] font-semibold text-toneek-amber font-sans mt-5 pt-4 border-t border-[#F0EAE4] dark:border-[#2A1C14]">
        The system does not end. It evolves.
      </p>
    </div>
  )
}
