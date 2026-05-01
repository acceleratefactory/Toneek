// src/lib/plans/planFeatures.ts

export type RoutineTier = 'just_one' | 'two_to_three' | 'whatever_it_takes'
export type PlanTier = 'essentials' | 'full_protocol' | 'restoration'

export interface PlanFeatures {
  description: string
  features: string[]
  upgrade_hook?: string  // One line that explains why to upgrade to this plan
}

export const PLAN_FEATURES: Record<RoutineTier, Record<PlanTier, PlanFeatures>> = {

  just_one: {
    essentials: {
      description: 'Your personalised formula. Monthly delivery.',
      features: [
        'Your personalised Toneek formula — custom compounded for your skin',
        'Full active ingredient breakdown with concentrations',
        'Climate-matched formulation base',
        'WhatsApp notification when dispatched',
        'Formula assigned in under 500ms from your assessment',
      ],
    },
    full_protocol: {
      description: 'Formula + clinical outcome tracking + priority reformulation.',
      upgrade_hook: 'Add clinical monitoring and guaranteed reformulation if needed.',
      features: [
        'Everything in Essentials',
        'Skin OS Score tracked and updated at every check-in',
        'Priority formula reformulation if Week 8 response is insufficient',
        'Skin response monitoring across 8 clinical metrics',
        'Week 2, 4, 8 clinical outcome tracking',
        'Formula performance data feeds future improvements',
      ],
    },
    restoration: {
      description: 'Three-phase barrier repair. 12-month programme.',
      upgrade_hook: 'For skin that needs barrier repair before active treatment.',
      features: [
        'Everything in Full Protocol',
        'Three-phase progressive formula system (barrier → treatment → maintenance)',
        '12-month barrier restoration plan',
        'Twice-daily application protocol (AM and PM)',
        'Dedicated clinical review at month 3 and month 6',
        'Assigned only when barrier compromise is confirmed',
      ],
    },
  },

  two_to_three: {
    essentials: {
      description: 'Formula + Cleanser + Moisturiser. Monthly delivery.',
      features: [
        'Your personalised Toneek formula — the active treatment step',
        'Toneek barrier-compatible gentle cleanser (included, delivered monthly)',
        'Toneek lightweight moisturiser matched to your formula chemistry',
        'All three products formulated to work together — no compatibility conflicts',
        'Climate-matched formulation across all three products',
        'WhatsApp notification when dispatched',
      ],
    },
    full_protocol: {
      description: 'Formula + Cleanser + Moisturiser + outcome tracking.',
      upgrade_hook: 'Add clinical monitoring and full routine optimisation.',
      features: [
        'Everything in Essentials (formula + cleanser + moisturiser)',
        'Skin OS Score tracked and updated at every check-in',
        'Priority formula reformulation if Week 8 response is insufficient',
        'Full morning and evening routine sequencing guide',
        'Skin response monitoring across 8 clinical metrics',
        'Week 2, 4, 8 clinical outcome tracking — all three products considered',
        'Cleanser and moisturiser updated when formula is reformulated',
      ],
    },
    restoration: {
      description: '3-phase barrier repair. 12 months. Full product set.',
      upgrade_hook: 'Full protocol with products that evolve through each repair phase.',
      features: [
        'Everything in Full Protocol (formula + cleanser + moisturiser)',
        'Three-phase progressive formula with matched cleanser and moisturiser at each phase',
        '12-month barrier restoration plan — all products evolve as barrier heals',
        'Twice-daily complete routine (AM: cleanse → formula → moisturise)',
        'Dedicated clinical review at month 3 and month 6',
        'All three products change when your protocol phase changes',
        'Highest priority reformulation and product adjustment',
      ],
    },
  },

  whatever_it_takes: {
    essentials: {
      description: 'Full 4-product routine. Monthly delivery.',
      features: [
        'Your personalised Toneek formula — the active treatment step',
        'Toneek barrier-compatible gentle cleanser (included)',
        'Toneek lightweight moisturiser matched to your formula',
        'Fourth product selected for your profile: SPF 50+ / Brightening Toner / Hydrating Toner',
        'All four products chemically compatible with each other',
        'Complete morning and evening routine guide — exact sequence, amounts, timing',
        'Climate-matched formulation across all four products',
      ],
    },
    full_protocol: {
      description: 'Full 4-product routine + clinical outcome tracking.',
      upgrade_hook: 'Track outcomes across your entire routine, not just the formula.',
      features: [
        'Everything in Essentials (all four products)',
        'Skin OS Score tracked across all 8 clinical metrics at every check-in',
        'Priority formula reformulation — and fourth product updated to match',
        'Full routine outcome tracking — the entire protocol, not just the formula',
        'Week 2, 4, 8 clinical monitoring with routine-adjusted expectations',
        'All four products updated at reformulation if your profile changes',
        'Skin response monitoring — early detection of product interactions',
      ],
    },
    restoration: {
      description: 'Full 4-product barrier repair system. 12 months.',
      upgrade_hook: 'The most comprehensive skin recovery system we offer.',
      features: [
        'Everything in Full Protocol (all four products)',
        'Three-phase progressive system — all four products evolve through each phase',
        'Phase 1: Barrier stabilisation complete product set',
        'Phase 2: Active treatment with updated cleanser + moisturiser + fourth product',
        'Phase 3: Maintenance and optimisation — full active routine',
        '12-month restoration plan with quarterly product rotation',
        'Dedicated clinical review at month 3 and month 6',
      ],
    },
  },

}
