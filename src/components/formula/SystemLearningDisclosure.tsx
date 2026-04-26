'use client'

// src/components/formula/SystemLearningDisclosure.tsx
// Static disclosure block placed at the bottom of both the results page
// and the dashboard formula page, above the CTA / subscribe banner.
//
// Purpose (from toneek_clinical_os_upgrade.md):
//   1. Increases check-in compliance — customers complete check-ins when
//      they understand why it matters beyond their own progress.
//   2. Communicates the platform's actual mission without marketing language.
//
// Content is fixed — not dynamic. No props required.

interface SystemLearningDisclosureProps {
  delayMs?: number
}

export default function SystemLearningDisclosure({ delayMs = 0 }: SystemLearningDisclosureProps) {
  return (
    <section
      className="animate-slide-up opacity-0 bg-[#F7F3EF] dark:bg-[#1E1410] border border-[#E8E0DA] dark:border-[#3A2820] rounded-2xl px-6 py-6 sm:px-8 sm:py-7"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Section label */}
      <p className="text-[10px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-4">
        Your Role in the Toneek System
      </p>

      {/* Divider line */}
      <div className="w-12 h-[2px] bg-toneek-amber/40 mb-5" />

      {/* Body */}
      <div className="flex flex-col gap-3">
        <p className="text-[14px] text-gray-800 dark:text-[#D4C5BE] font-sans leading-relaxed">
          Your check-ins are not just for your benefit.
        </p>
        <p className="text-[13px] text-gray-600 dark:text-[#A3938C] font-sans leading-relaxed">
          Every outcome you report improves the formula assigned to the next person with a similar profile to yours.
        </p>
        <p className="text-[13px] text-gray-600 dark:text-[#A3938C] font-sans leading-relaxed">
          You are part of an active learning system. Your data helps build what does not exist anywhere in the world: a clinical evidence base for melanin-rich skin.
        </p>
        <p className="text-[12px] text-gray-400 dark:text-[#7A6A62] font-sans leading-relaxed italic mt-1">
          Your identity is never shared. Your outcomes contribute anonymously to the system's intelligence.
        </p>
      </div>
    </section>
  )
}
