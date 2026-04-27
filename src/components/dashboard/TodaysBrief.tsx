// src/components/dashboard/TodaysBrief.tsx
// Hero block — first content the customer sees after the status bar.
// Full-width, deep brown card, two-column desktop / single-column mobile.
// All content logic is pure (no state, no client directive).
// Per toneek_dashboard_reorganisation.md — Phase 2.

interface TodaysBriefProps {
  subscriptionStartedAt: string | null  // ISO date from subscriptions table
  assessedAt: string                    // fallback if no subscription date
  primaryConcern: string                // from skin_assessments
  formulaTier: string | null            // e.g. 'restoration'
  orderStatus?: string | null           // latest order.status
  dispatchHeldReason?: string | null    // latest order.dispatch_held_reason
  hasDueCheckin: boolean
  dueCheckinWeek: number
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

function getDaysActive(startIso: string): number {
  const start = new Date(startIso)
  const now   = new Date()
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

function formatDate(iso: string, offsetDays: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + offsetDays)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

// ─── DO TODAY content ─────────────────────────────────────────────────────────

function getDoTodayText(
  formulaTier: string | null,
  orderStatus: string | null | undefined,
  dispatchHeldReason: string | null | undefined,
  hasDueCheckin: boolean,
  dueCheckinWeek: number,
): string {
  // Priority 1: dispatch held = check-in blocking order
  if (dispatchHeldReason) {
    return `Complete your Week ${dueCheckinWeek || '2'} check-in — your next order depends on it.`
  }
  // Priority 2: check-in due
  if (hasDueCheckin) {
    return `Complete your Week ${dueCheckinWeek} check-in — your next order depends on it.`
  }
  // Priority 3: order in production (not yet dispatched)
  const inProduction = [
    'pending_payment', 'pending_verification', 'payment_confirmed',
    'pending_formulation', 'formulating',
  ]
  if (orderStatus && inProduction.includes(orderStatus)) {
    return 'Your formula is in production. Application begins on delivery.'
  }
  // Priority 4: restoration tier = twice daily
  if (formulaTier === 'restoration') {
    return 'Apply your formula morning and evening. 0.5ml each application.'
  }
  // Default
  return 'Apply your formula tonight at bedtime. 0.5ml — pea-sized amount.'
}

// ─── Status indicator ─────────────────────────────────────────────────────────

type StatusState = 'on_track' | 'checkin_required' | 'order_held' | 'in_production'

function getStatus(
  orderStatus: string | null | undefined,
  dispatchHeldReason: string | null | undefined,
  hasDueCheckin: boolean,
): StatusState {
  if (dispatchHeldReason) return 'order_held'
  if (hasDueCheckin)       return 'checkin_required'
  const inProduction = [
    'pending_payment', 'pending_verification', 'payment_confirmed',
    'pending_formulation', 'formulating',
  ]
  if (orderStatus && inProduction.includes(orderStatus)) return 'in_production'
  return 'on_track'
}

// ─── Next Checkpoint ──────────────────────────────────────────────────────────

function getNextCheckpoint(
  startIso: string,
  daysActive: number,
  hasDueCheckin: boolean,
  dueCheckinWeek: number,
): { label: string; sub: string; isOpen: boolean } {
  if (hasDueCheckin) {
    return {
      label: `Week ${dueCheckinWeek} check-in is open now`,
      sub: 'Complete it to release your next order.',
      isOpen: true,
    }
  }
  if (daysActive < 14) {
    const days = 14 - daysActive
    return {
      label: `Week 2 check-in · Opens ${formatDate(startIso, 14)}`,
      sub: `· ${days} day${days !== 1 ? 's' : ''}`,
      isOpen: false,
    }
  }
  if (daysActive < 28) {
    const days = 28 - daysActive
    return {
      label: `Week 4 check-in · Opens ${formatDate(startIso, 28)}`,
      sub: `· ${days} day${days !== 1 ? 's' : ''}`,
      isOpen: false,
    }
  }
  if (daysActive < 56) {
    const days = 56 - daysActive
    return {
      label: `Week 8 check-in · Opens ${formatDate(startIso, 56)}`,
      sub: `· ${days} day${days !== 1 ? 's' : ''}`,
      isOpen: false,
    }
  }
  return {
    label: 'All check-ins complete.',
    sub: 'Formula review available.',
    isOpen: false,
  }
}

// ─── Expected This Week ───────────────────────────────────────────────────────

function getExpectedThisWeek(
  daysActive: number,
  primaryConcern: string,
  startIso: string,
): string {
  const concern = (primaryConcern || '').toLowerCase()
  const weekNum = Math.floor(daysActive / 7) + 1

  // Past Week 8
  if (daysActive >= 56) {
    const reviewDate = formatDate(startIso, 42)
    return `Protocol cycle complete. Formula review available from ${reviewDate}.`
  }
  // Week 5–8
  if (daysActive >= 29) {
    return 'Approaching Week 8 assessment. This is your primary clinical milestone. Skin OS Score recalculates at Week 8.'
  }
  // Week 3–4
  if (daysActive >= 15) {
    if (concern === 'pih' || concern === 'tone') {
      return 'Melanin transfer reduction underway. Week 4 is your first visible pigmentation milestone.'
    }
    return 'Protocol holding. Week 4 check-in will show first measurable improvement data.'
  }
  // Week 2 (days 8–14)
  if (daysActive >= 8) {
    return 'Skin calming measurably. Complete your Week 2 check-in to record your progress and release your next order.'
  }
  // Week 1 — concern-specific
  if (concern === 'pih' || concern === 'tone') {
    return 'Surface inflammation calming. No visible pigment change yet — this is normal and expected at Week 1.'
  }
  if (concern === 'acne') {
    return 'Follicular exfoliation beginning. Mild initial purging can occur and is expected. It subsides by Day 10.'
  }
  if (concern === 'dryness') {
    return 'Barrier repair actives at work. Tightness should reduce within 7–10 days.'
  }
  if (concern === 'sensitivity') {
    return 'Calming actives reducing reactivity. Mild tingling normalises by Day 5.'
  }
  return 'Protocol initiated. First measurable changes visible at Week 2 check-in.'
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TodaysBrief({
  subscriptionStartedAt,
  assessedAt,
  primaryConcern,
  formulaTier,
  orderStatus,
  dispatchHeldReason,
  hasDueCheckin,
  dueCheckinWeek,
}: TodaysBriefProps) {
  const startIso   = subscriptionStartedAt || assessedAt
  const daysActive = getDaysActive(startIso)
  const weekNum    = Math.floor(daysActive / 7) + 1

  const doTodayText  = getDoTodayText(formulaTier, orderStatus, dispatchHeldReason, hasDueCheckin, dueCheckinWeek)
  const status       = getStatus(orderStatus, dispatchHeldReason, hasDueCheckin)
  const checkpoint   = getNextCheckpoint(startIso, daysActive, hasDueCheckin, dueCheckinWeek)
  const expectedText = getExpectedThisWeek(daysActive, primaryConcern, startIso)

  // Status indicator config
  const statusConfig = {
    on_track: {
      dot: '#1C5C3A',
      text: 'On Track',
      link: null,
    },
    checkin_required: {
      dot: '#C87D3E',
      text: 'Check-in Required',
      link: `/dashboard/checkin?week=${dueCheckinWeek}`,
    },
    order_held: {
      dot: '#C87D3E',
      text: 'Order Held — check-in needed',
      link: `/dashboard/checkin?week=${dueCheckinWeek || 2}`,
    },
    in_production: {
      dot: '#8C7B72',
      text: 'Formula in production',
      link: null,
    },
  }[status]

  return (
    <div
      className="w-full rounded-xl px-8 py-6 font-sans"
      style={{ backgroundColor: '#2A0F06' }}
    >
      {/* Header strip */}
      <p className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: '#C87D3E' }}>
        Today · Week {weekNum}
      </p>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── LEFT: DO TODAY ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#C87D3E' }}>
            Do Today
          </p>
          <p className="text-[14px] leading-relaxed mb-4" style={{ color: '#F7F1EB' }}>
            {doTodayText}
          </p>

          {/* Status indicator */}
          {statusConfig.link ? (
            <a
              href={statusConfig.link}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold hover:underline transition-opacity hover:opacity-80"
              style={{ color: statusConfig.dot }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusConfig.dot }}
              />
              {statusConfig.text}
            </a>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
              style={{ color: statusConfig.dot }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusConfig.dot }}
              />
              {statusConfig.text}
            </span>
          )}
        </div>

        {/* ── RIGHT: NEXT CHECKPOINT + EXPECTED THIS WEEK ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#C87D3E' }}>
            Next Checkpoint
          </p>
          {checkpoint.isOpen ? (
            <a
              href={`/dashboard/checkin?week=${dueCheckinWeek}`}
              className="text-[14px] font-semibold leading-snug mb-1 hover:underline transition-opacity hover:opacity-80 block"
              style={{ color: '#C87D3E' }}
            >
              {checkpoint.label}
            </a>
          ) : (
            <p className="text-[14px] font-semibold leading-snug mb-1" style={{ color: '#F7F1EB' }}>
              {checkpoint.label}
            </p>
          )}
          <p className="text-[12px] mb-6" style={{ color: '#8C7B72' }}>
            {checkpoint.sub}
          </p>

          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#C87D3E' }}>
            Expected This Week
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#D4C5BE' }}>
            {expectedText}
          </p>
        </div>
      </div>
    </div>
  )
}
