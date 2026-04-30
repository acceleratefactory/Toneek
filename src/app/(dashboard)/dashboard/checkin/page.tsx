import { Suspense } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminClient } from '@/lib/supabase/admin'
import { calculateClinicalDates, ClinicalDates } from '@/lib/dates/clinicalDates'
import CheckinContent from './CheckinContent'

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

export default async function CheckinPage() {
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

    if (!currentCheckinWeek) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem' }}>
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3A2820] rounded-xl p-8 text-center shadow-sm">
                    <h2 className="text-toneek-brown dark:text-[#F0E6DF] text-xl font-bold mb-2">
                        No Check-in Due
                    </h2>
                    <p className="text-gray-600 dark:text-[#A3938C] text-sm mb-6">
                        You do not currently have an active check-in. Check-ins open at Week 2, 4, and 8 of your protocol.
                    </p>
                    <a href="/dashboard/formula" className="inline-block px-6 py-3 bg-[#E8E0DA] dark:bg-[#3A2820] text-toneek-brown dark:text-[#F0E6DF] rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
                        Return to Dashboard
                    </a>
                </div>
            </div>
        )
    }

    return (
        <Suspense fallback={<div style={{ padding: '2rem', color: '#888' }}>Loading…</div>}>
            <CheckinContent week={currentCheckinWeek} />
        </Suspense>
    )
}
