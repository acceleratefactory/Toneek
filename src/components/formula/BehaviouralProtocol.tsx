'use client'

import React from 'react'
import { Sun, Droplets, CloudRain, Hexagon, Sparkles, X } from 'lucide-react'
// src/components/formula/BehaviouralProtocol.tsx
// Displays the customer's personalised usage protocol.
// Supports both single-product lists and multi-product step sequences.

interface Step {
  step: number
  product: string
  instruction: string
  timing?: string | null
  note?: string
}

interface RoutineSequence {
  title: string
  steps: Step[]
}

interface ProtocolData {
  routine_type: 'single_product' | 'two_to_three' | 'full_routine'
  application_instructions?: string[]
  use_alongside?: string[]
  morning?: RoutineSequence
  evening?: RoutineSequence
  general_notes?: string[]
  fourth_product_note?: string
  what_to_avoid: string[]
  first_week_note: string
}

interface BehaviouralProtocolProps {
  protocol: ProtocolData | any
  delayMs?: number
}

// ─── Sub-section layout ───────────────────────────────────────────────────────

function VerticalListBlock({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-col w-full">
      <h6 className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-4">
        {title}
      </h6>
      <div className="flex flex-col relative pl-3">
        {/* Continuous connecting line */}
        <div className="absolute left-[11px] top-4 bottom-8 w-[1px] bg-toneek-amber/40"></div>

        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-4 mb-6 relative">
            <div className="flex-shrink-0 w-[24px] h-[24px] rounded-full bg-[#2A0F06] dark:bg-[#E8DDD8] text-white dark:text-[#2A0F06] flex items-center justify-center text-[11px] font-bold z-10 shadow-sm border border-[#2A0F06]/10">
              {index + 1}
            </div>
            <div className="flex flex-col pt-0.5 min-w-0 flex-1 pr-2">
              <span className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-sans leading-snug break-words">
                {item}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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
            <span className="text-[13px] text-gray-700 dark:text-[#D4C5BE] font-sans leading-snug min-w-0 flex-1 pr-2">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function getProductIcon(productName: string) {
  const name = productName.toLowerCase()
  if (name.includes('cleanser') || name.includes('wash')) return <Droplets size={16} className="text-toneek-amber" />
  if (name.includes('moisturiser') || name.includes('cream')) return <CloudRain size={16} className="text-toneek-amber" />
  if (name.includes('spf') || name.includes('sunscreen') || name.includes('sunblock')) return <Sun size={16} className="text-toneek-amber" />
  if (name.includes('formula') || name.includes('treatment') || name.includes('active')) return <Hexagon size={16} className="text-toneek-amber fill-toneek-amber/20" />
  return <Sparkles size={16} className="text-toneek-amber" />
}

function SequenceBlock({ sequence }: { sequence: RoutineSequence }) {
  if (!sequence) return null;

  return (
    <div className="flex flex-col w-full">
      <h6 className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-4">
        {sequence.title}
      </h6>
      <div className="flex flex-col relative pl-3">
        {/* Continuous connecting line */}
        <div className="absolute left-[11px] top-4 bottom-8 w-[1px] bg-toneek-amber/40"></div>

        {sequence.steps.map((step, index) => (
          <div key={step.step} className="flex items-start gap-4 mb-6 relative">
            <div className="flex-shrink-0 w-[24px] h-[24px] rounded-full bg-[#2A0F06] dark:bg-[#E8DDD8] text-white dark:text-[#2A0F06] flex items-center justify-center text-[11px] font-bold z-10 shadow-sm border border-[#2A0F06]/10">
              {step.step}
            </div>
            <div className="flex flex-col pt-0.5 min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-2 mb-1">
                {getProductIcon(step.product)}
                <span className="text-[13px] font-semibold text-toneek-brown dark:text-[#F0E6DF] leading-tight font-sans">
                  {step.product}
                </span>
              </div>
              <span className="text-[11px] text-[#8C7B72] dark:text-[#A3938C] leading-snug font-sans">
                {step.instruction} {step.timing}
              </span>
              {step.note && (
                <span className="text-[10px] text-toneek-amber/90 dark:text-toneek-amber/80 mt-1 italic font-sans">
                  * {step.note}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BehaviouralProtocol({
  protocol,
  delayMs = 0,
}: BehaviouralProtocolProps) {

  const isMultiProduct = protocol.routine_type === 'two_to_three' || protocol.routine_type === 'full_routine'

  // Backwards compatibility if using the old object format where `application` is an array
  const appInstructions = protocol.application_instructions || protocol.application || []
  const useAlongsideList = protocol.use_alongside || protocol.useAlongside || []
  const avoidList = protocol.what_to_avoid || protocol.avoid || []
  
  // Format the first week note from either array or string
  const firstWeekLines = Array.isArray(protocol.firstWeek) 
    ? protocol.firstWeek 
    : (protocol.first_week_note || '').split('\n').filter((l: string) => l.trim().length > 0)

  return (
    <section
      className="animate-slide-up opacity-0 bg-white dark:bg-[#1A1210] border border-gray-100 dark:border-[#3A2820] rounded-2xl shadow-sm overflow-hidden"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-[#3A2820] bg-[#FAF8F5] dark:bg-[#261B18]">
        <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans">
          Your Personalised Protocol
        </p>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-8">

        {/* Left column: Sequences or Single Product usage */}
        <div className="flex flex-col gap-6">
          {isMultiProduct ? (
            <>
              {protocol.morning && <SequenceBlock sequence={protocol.morning} />}
              {protocol.evening && <SequenceBlock sequence={protocol.evening} />}
            </>
          ) : (
            <>
              <VerticalListBlock
                title="Application"
                items={appInstructions}
              />
              <VerticalListBlock
                title="Use Alongside"
                items={useAlongsideList}
              />
            </>
          )}
        </div>

        {/* Right column: Avoid, Notes, First Week */}
        <div className="flex flex-col gap-6">
          {avoidList && avoidList.length > 0 && (
            <div className="flex flex-col gap-2">
              <h6 className="text-[10px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans">
                What to Avoid
              </h6>
              <div className="flex flex-wrap gap-2 mt-1">
                {avoidList.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 px-2.5 py-1.5 bg-[#FAF8F5] dark:bg-[#261B18] rounded border border-gray-100 dark:border-[#3A2820]">
                    <X size={12} className="text-[#C13B2E] dark:text-[#E07070] flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-[#D4C5BE] leading-tight break-words min-w-0">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isMultiProduct && protocol.general_notes && protocol.general_notes.length > 0 && (
            <ProtocolBlock
              title="Protocol Notes"
              items={protocol.general_notes}
              type="bullet"
            />
          )}

          {protocol.fourth_product_note && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
              <span className="text-[13px] text-blue-800 dark:text-blue-300 font-sans leading-snug block">
                {protocol.fourth_product_note}
              </span>
            </div>
          )}

          {/* First week — full-width amber callout */}
          <div className="md:col-span-1">
            <h6 className="text-[10px] font-bold text-gray-400 dark:text-[#A3938C] uppercase tracking-widest font-sans mb-2">
              First Week — What to Expect
            </h6>
            <div className="bg-[#FEF9F3] dark:bg-[#2A1C10] border border-toneek-amber/20 rounded-xl p-4 flex flex-col gap-2">
              {firstWeekLines.map((line: string, i: number) => (
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
              <div className="mt-3 pt-3 border-t border-toneek-amber/20">
                <a
                  href="/dashboard/report-concern"
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-red-600 dark:text-red-400 hover:underline"
                >
                  <span>⚠</span>
                  Experiencing a reaction? Report a concern immediately
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
