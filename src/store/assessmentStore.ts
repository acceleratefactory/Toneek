// src/store/assessmentStore.ts
// Zustand store for the 10-step skin assessment flow.
// No DB writes until the final submit in Step 10.

import { create } from 'zustand'

interface AssessmentState {
    currentStep: number
    totalSteps: number

    // Step 1 — Location
    country_of_residence: string
    city_of_residence: string
    climate_zone: string
    years_in_current_location: string
    climate_transition_effects: string[]

    // Step 2 — Primary concern (before skin type)
    primary_concern: string

    // Step 3 — Skin type (reframed — no "skin type" label in UI)
    skin_type: string

    // Step 4 — Secondary concerns (multi-select, max 3)
    secondary_concerns: string[]

    // Step 5 — Duration and trajectory (NEW)
    concern_duration: string
    concern_trajectory: string

    // Step 6 — Triggers (NEW, multi-select, no maximum)
    triggers: string[]

    // Step 7 — Bleaching / toning history
    bleaching_history: string
    bleaching_cessation_effects: string[]

    // Step 8 — Hormonal and medical (EXPANDED)
    pregnant_or_breastfeeding: boolean | null
    hormonal_contraception: boolean | null
    medications: string[]

    // Step 9 — Current routine (NEW)
    current_product_count: string
    current_actives: string[]
    routine_expectation: string

    // Step 10 — Photo + email + acquisition
    photo_url: string
    photo_consent: boolean
    email: string
    how_did_you_hear: string

    // Computed / derived (set after submit returns)
    formula_code: string
    skin_os_score: number | null

    // Actions
    setField: (field: string, value: any) => void
    nextStep: () => void
    prevStep: () => void
    goToStep: (step: number) => void
    reset: () => void
}

const initialState = {
    currentStep: 1,
    totalSteps: 10,

    // Step 1
    country_of_residence: '',
    city_of_residence: '',
    climate_zone: '',
    years_in_current_location: '',
    climate_transition_effects: [],

    // Step 2
    primary_concern: '',

    // Step 3
    skin_type: '',

    // Step 4
    secondary_concerns: [],

    // Step 5
    concern_duration: '',
    concern_trajectory: '',

    // Step 6
    triggers: [],

    // Step 7
    bleaching_history: '',
    bleaching_cessation_effects: [],

    // Step 8
    pregnant_or_breastfeeding: null,
    hormonal_contraception: null,
    medications: [],

    // Step 9
    current_product_count: '',
    current_actives: [],
    routine_expectation: '',

    // Step 10
    photo_url: '',
    photo_consent: false,
    email: '',
    how_did_you_hear: '',

    // Derived
    formula_code: '',
    skin_os_score: null,
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
    ...initialState,

    setField: (field, value) =>
        set((state) => ({ ...state, [field]: value })),

    nextStep: () =>
        set((state) => ({
            currentStep: Math.min(state.currentStep + 1, state.totalSteps),
        })),

    prevStep: () =>
        set((state) => ({
            currentStep: Math.max(state.currentStep - 1, 1),
        })),

    goToStep: (step) =>
        set({ currentStep: Math.max(1, Math.min(step, get().totalSteps)) }),

    reset: () => set({ ...initialState }),
}))
