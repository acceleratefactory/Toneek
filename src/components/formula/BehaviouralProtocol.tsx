'use client'

// src/components/formula/BehaviouralProtocol.tsx
// Displays the customer's personalised usage protocol.
// Sections: Application / What to Avoid / Use Alongside / First Week Expectations
// Rendered as a full-width card on both results and dashboard pages.

import type { ProtocolSection } from '@/lib/protocol/generateProtocol'

interface BehaviouralProtocolProps {
  protocol: ProtocolSection
  delayMs?: number
}

// ─── Sub-section layout ───────────────────────────────────────────────────────

function ProtocolBlock({
  title,
  items,
  type,
}: {
  title: string
  items: string[]
  type: 'check' | 'cross' | 'bullet' | 'warning'
}) {
  const icons: Record<typeof type, string> = {
    check:   '✓',
    cross:   '✗',
    bullet:  '→',
    warning: '⚠',
  }
  const colours: Record<typeof type, string> = {
    check:   'text-toneek-forest dark:text-[#4caf82]',
    cross:   'text-[#C13B2E] dark:text-[#E07070]',
    bullet:  'text-toneek-amber',
    warning: 'text-toneek-amber',
  }

  return (
    <div className="flex flex-col gap-2">
      <h6 className="text-[10px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans">
        {title}
      </h6>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`flex-shrink-0 font-bold text-[13px] mt-0.5 ${colours[type]}`}>
              {icons[type]}
            </span>
            <span className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-sans leading-snug">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BehaviouralProtocol({
  protocol,
  delayMs = 0,
}: BehaviouralProtocolProps) {
  return (
    <section
      className="animate-slide-up opacity-0 bg-white dark:bg-[#1A1210] border border-gray-100 dark:border-[#3A2820] rounded-2xl shadow-sm overflow-hidden"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A2820] bg-[#FAF8F5] dark:bg-[#261B18]">
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans">
          Your Protocol
        </p>
      </div>

      {/* Body — 2-column on desktop, stacked on mobile */}
      <div className="p-6 grid sm:grid-cols-2 gap-6">

        {/* Left column */}
        <div className="flex flex-col gap-5">
          <ProtocolBlock
            title="Application"
            items={protocol.application}
            type="bullet"
          />
          <ProtocolBlock
            title="Use Alongside"
            items={protocol.useAlongside}
            type="check"
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <ProtocolBlock
            title="What to Avoid While on This Formula"
            items={protocol.avoid}
            type="cross"
          />

          {/* First week — full-width amber callout */}
          <div className="sm:col-span-2">
            <h6 className="text-[10px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-2">
              First Week — What to Expect
            </h6>
            <div className="bg-[#FEF9F3] dark:bg-[#2A1C10] border border-toneek-amber/20 rounded-xl p-4 flex flex-col gap-2">
              {protocol.firstWeek.map((line, i) => (
                <p
                  key={i}
                  className={`text-[13px] font-sans leading-snug ${
                    i === 0
                      ? 'text-gray-700 dark:text-[#D4C5BE]'
                      : 'text-[#8C7B72] dark:text-[#A3938C]'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
