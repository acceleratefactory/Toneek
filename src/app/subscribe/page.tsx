// src/app/subscribe/page.tsx
// Plan selection page — customer arrives here from results page CTA.
// Server component: reads assessment to resolve currency, then passes to client.

import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrency } from '@/lib/currency'
import { redirect } from 'next/navigation'
import SubscribePlans from '@/components/payment/SubscribePlans'

export const metadata = {
    title: 'Choose your plan — Toneek',
    description: 'Select a Toneek subscription plan. Payment by bank transfer only.',
}

export default async function SubscribePage({
    searchParams,
}: {
    searchParams: Promise<{ assessment_id?: string }>
}) {
    const { assessment_id } = await searchParams

    if (!assessment_id) redirect('/assessment')

    // Fetch assessment to get country → currency and formula
    const { data: assessment, error } = await adminClient
        .from('skin_assessments')
        .select('id, user_id, country_of_residence, formula_code, skin_os_score')
        .eq('id', assessment_id)
        .single()

    if (error || !assessment) redirect('/assessment')

    const currency = resolveCurrency(assessment.country_of_residence ?? 'Nigeria')

    return (
        <main className="assessment-page">
            <div className="assessment-container" style={{ maxWidth: '640px' }}>
                <div className="assessment-header">
                    <span className="brand">Toneek</span>
                    <p className="tagline">Choose the plan that works for you</p>
                </div>

                <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div>
                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your formula</p>
                        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--foreground)' }}>{assessment.formula_code}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Skin OS Score</p>
                        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>{assessment.skin_os_score}</p>
                    </div>
                </div>

                <SubscribePlans
                    assessmentId={assessment_id}
                    userId={assessment.user_id ?? null}
                    currency={currency}
                />

                <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '1.5rem', lineHeight: '1.6' }}>
                    Payment by bank transfer only. Your formula is made to order and dispatched within 5–7 business days of payment confirmation.
                </p>
            </div>
        </main>
    )
}
