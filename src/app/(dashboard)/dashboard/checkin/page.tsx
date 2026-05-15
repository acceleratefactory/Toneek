import { Suspense } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminClient } from '@/lib/supabase/admin'
import { calculateClinicalDates, ClinicalDates } from '@/lib/dates/clinicalDates'
import CheckinContent from './CheckinContent'
import CheckinCountdownTimer from '@/components/checkin/CheckinCountdownTimer'

function getCurrentCheckinWeek(dates: ClinicalDates, outcomes: any[]): number | null {
  if (!dates.has_received) return null
  const now = new Date()
  
  const w2_done = outcomes.some(o => o.check_in_week === 2)
  const w4_done = outcomes.some(o => o.check_in_week === 4)
  const w8_done = outcomes.some(o => o.check_in_week === 8)

  if (!w2_done && dates.week2_date && now >= dates.week2_date) return 2
  if (w2_done && !w4_done && dates.week4_date && now >= dates.week4_date) return 4
  if (w4_done && !w8_done && dates.week8_date && now >= dates.week8_date) return 8
  
  return null
}

function getNextCheckinInfo(dates: ClinicalDates, outcomes: any[]): { week: number, date: Date } | null {
  if (!dates.has_received) return null
  
  const w2_done = outcomes.some(o => o.check_in_week === 2)
  const w4_done = outcomes.some(o => o.check_in_week === 4)
  const w8_done = outcomes.some(o => o.check_in_week === 8)

  if (!w2_done && dates.week2_date) return { week: 2, date: dates.week2_date }
  if (w2_done && !w4_done && dates.week4_date) return { week: 4, date: dates.week4_date }
  if (w4_done && !w8_done && dates.week8_date) return { week: 8, date: dates.week8_date }
  
  return null
}

export default async function CheckinPage({
  searchParams,
}: {
  searchParams: { mode?: string; week?: string }
}) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    const isEmergency = searchParams?.mode === 'emergency'

    const { data: latestOrder } = await adminClient
        .from('orders')
        .select('received_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    const { data: outcomes } = await adminClient
        .from('skin_outcomes')
        .select('check_in_week')
        .eq('user_id', session.user.id)

    const clinical_dates = calculateClinicalDates(latestOrder?.received_at ?? null)
    const currentCheckinWeek = getCurrentCheckinWeek(clinical_dates, outcomes || [])

    // ── Emergency mode: bypass date lock, always show form ───────────
    if (isEmergency && clinical_dates.has_received) {
        return (
            <Suspense fallback={<div style={{ padding: '2rem', color: '#888' }}>Loading…</div>}>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <span className="text-red-600 text-lg flex-shrink-0">⚠</span>
                    <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Emergency Reaction Report</p>
                        <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                            Please describe your reaction below. Stop the suspected product and do not apply your formula until you have submitted this report.
                        </p>
                    </div>
                </div>
                <CheckinContent week={currentCheckinWeek ?? 2} isEmergency={true} />
            </Suspense>
        )
    }

    // ── Standard schedule: no check-in due ───────────────────────────
    if (!currentCheckinWeek) {
        const nextInfo = getNextCheckinInfo(clinical_dates, outcomes || [])
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem' }}>
                <CheckinCountdownTimer 
                    hasReceived={clinical_dates.has_received}
                    nextCheckinWeek={nextInfo?.week || null}
                    nextCheckinDate={nextInfo?.date || null}
                />
            </div>
        )
    }

    return (
        <Suspense fallback={<div style={{ padding: '2rem', color: '#888' }}>Loading…</div>}>
            <CheckinContent week={currentCheckinWeek} />
        </Suspense>
    )
}

