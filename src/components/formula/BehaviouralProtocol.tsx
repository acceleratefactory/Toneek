'use client'

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

function SequenceBlock({ sequence }: { sequence: RoutineSequence }) {
  if (!sequence) return null;

  return (
    <div className="flex flex-col gap-3">
      <h6 className="text-[11px] font-bold text-toneek-amber uppercase tracking-widest font-sans border-b border-toneek-amber/20 pb-1 inline-block">
        {sequence.title}
      </h6>
      <div className="flex flex-col gap-3">
        {sequence.steps.map((step) => (
          <div key={step.step} className="flex items-start gap-3 bg-gray-50/50 dark:bg-black/20 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-toneek-amber/10 dark:bg-toneek-amber/20 text-toneek-amber flex items-center justify-center text-[10px] font-bold">
              {step.step}
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight mb-0.5">
                {step.product}
              </span>
              <span className="text-[13px] text-gray-600 dark:text-gray-400 leading-snug">
                {step.instruction}
              </span>
              {step.note && (
                <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 italic">
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
              <ProtocolBlock
                title="Application"
                items={appInstructions}
                type="bullet"
              />
              <ProtocolBlock
                title="Use Alongside"
                items={useAlongsideList}
                type="check"
              />
            </>
          )}
        </div>

        {/* Right column: Avoid, Notes, First Week */}
        <div className="flex flex-col gap-6">
          <ProtocolBlock
            title="What to Avoid"
            items={avoidList}
            type="cross"
          />

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
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
