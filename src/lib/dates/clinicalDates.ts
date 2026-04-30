// src/lib/dates/clinicalDates.ts

export interface ClinicalDates {
  anchor_date: Date | null
  week2_date: Date | null
  week4_date: Date | null
  week8_date: Date | null
  review_date: Date | null
  days_since_receipt: number | null
  week_number: number | null
  has_received: boolean
}

export function calculateClinicalDates(received_at: string | null): ClinicalDates {
  if (!received_at) {
    return {
      anchor_date: null,
      week2_date: null,
      week4_date: null,
      week8_date: null,
      review_date: null,
      days_since_receipt: null,
      week_number: null,
      has_received: false,
    }
  }

  const anchor = new Date(received_at)
  const now = new Date()
  const days_since = Math.floor(
    (now.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24)
  )
  const week_number = Math.floor(days_since / 7) + 1

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  return {
    anchor_date: anchor,
    week2_date: addDays(anchor, 14),
    week4_date: addDays(anchor, 28),
    week8_date: addDays(anchor, 56),
    review_date: addDays(anchor, 42),
    days_since_receipt: days_since,
    week_number: Math.min(week_number, 9), // cap at week 9
    has_received: true,
  }
}

export function formatDate(date: Date | null): string {
  if (!date) return 'Date confirmed on delivery'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(date: Date | null): string {
  if (!date) return 'TBC'
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
