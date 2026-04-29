// src/components/formula/IntelligenceMilestones.tsx
// Shows a 4-step milestone tracker for the Toneek intelligence system.
// Placed below DecisionConfidence on /dashboard/formula only.
// Circle states: filled amber = passed, pulsing amber border = next, empty = not reached.
// Per toneek_final_five_upgrades.md — GAP 5.

interface IntelligenceMilestonesProps {
  outcomeCount: number            // from prediction_log WHERE actual_week8_score IS NOT NULL
  newlyUnlockedMilestone?: number // if set, animate that milestone's circle once
  delayMs?: number
}

const MILESTONES = [
  { count: 50,   label: '50 profiles',    description: 'Low confidence mode unlocks' },
  { count: 200,  label: '200 profiles',   description: 'Predictive mode unlocks' },
  { count: 1000, label: '1,000 profiles', description: 'Full intelligence mode' },
  { count: 5000, label: '5,000 profiles', description: 'B2B data layer activates' },
]

export default function IntelligenceMilestones({
  outcomeCount,
  newlyUnlockedMilestone,
  delayMs = 0,
}: IntelligenceMilestonesProps) {
  // Find the index of the first milestone not yet passed
  const nextIndex = MILESTONES.findIndex(m => outcomeCount < m.count)

  return (
    <div
      className="animate-slide-up opacity-0"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Title */}
      <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-4">
        System Intelligence Milestones
      </p>

      {/* Step list */}
      <div className="flex flex-col gap-3">
        {MILESTONES.map((milestone, i) => {
          const isPassed  = outcomeCount >= milestone.count
          const isNext    = i === nextIndex  // closest upcoming milestone
          const isEmpty   = !isPassed && !isNext

          return (
            <div key={milestone.count} className="flex items-center gap-3">
              {/* Circle indicator */}
              <div className="flex-shrink-0 relative">
                {isPassed ? (
                  // Filled amber = milestone passed
                  // Apply unlock animation if this is the newly unlocked milestone
                  <div
                    className={`w-5 h-5 rounded-full bg-toneek-amber flex items-center justify-center${
                      newlyUnlockedMilestone === milestone.count ? ' milestone-unlock' : ''
                    }`}
                  >
                    <span className="text-white text-[9px] font-bold">✓</span>
                  </div>
                ) : isNext ? (
                  // Pulsing amber border = next milestone
                  <div className="w-5 h-5 rounded-full border-2 border-toneek-amber animate-pulse bg-transparent" />
                ) : (
                  // Empty circle = not yet reached
                  <div className="w-5 h-5 rounded-full border-2 border-[#E8E0DA] dark:border-[#3A2820] bg-transparent" />
                )}
              </div>

              {/* Labels */}
              <div className="flex items-baseline gap-2 min-w-0">
                <span className={`text-[11px] font-semibold font-sans ${
                  isPassed
                    ? 'text-toneek-amber'
                    : isNext
                    ? 'text-toneek-amber/80'
                    : 'text-[#8C7B72] dark:text-[#6A5A62]'
                }`}>
                  {milestone.label}
                </span>
                <span className="text-[10px] text-[#8C7B72] dark:text-[#6A5A62] font-sans truncate">
                  — {milestone.description}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current status footer */}
      <p className="text-[10px] text-[#8C7B72] dark:text-[#7A6A62] font-sans italic mt-4 pt-3 border-t border-[#F0EAE4] dark:border-[#2A1C14]">
        Currently: Cold Start · {outcomeCount} profile{outcomeCount === 1 ? '' : 's'} collected
      </p>
    </div>
  )
}
