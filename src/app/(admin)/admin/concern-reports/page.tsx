// src/app/(admin)/admin/concern-reports/page.tsx
// Admin view for all customer concern/reaction reports.
// Visually distinct from regular check-ins. Allows marking as Resolved.

import { adminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  severe:   { label: 'Severe',   bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
  moderate: { label: 'Moderate', bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300' },
  mild:     { label: 'Mild',     bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
}

const PRODUCT_LABELS: Record<string, string> = {
  formula:      'Toneek Formula',
  cleanser:     'Toneek Barrier Cleanser',
  moisturiser:  'Toneek Lightweight Moisturiser',
  spf:          'Toneek Mineral SPF 50',
  toner_brt:    'Toneek Brightening Toner',
  toner_hyd:    'Toneek Hydrating Toner',
  unsure:       'Not sure which product',
}

async function getConcernReports(tab: string) {
  const query = adminClient
    .from('concern_reports')
    .select('id, user_id, formula_code, suspected_product, severity, description, day_of_protocol, photo_url, status, admin_notes, submitted_at, resolved_at')
    .order('submitted_at', { ascending: false })

  if (tab === 'open') {
    query.eq('status', 'open')
  } else if (tab === 'resolved') {
    query.eq('status', 'resolved')
  }

  const { data: reports, error } = await query
  if (error) console.error('concern_reports fetch error:', error)
  if (!reports || reports.length === 0) return []

  // Fetch profiles separately to avoid FK constraint name dependency
  const userIds = [...new Set(reports.map((r: any) => r.user_id).filter(Boolean))]
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', userIds)

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))

  return reports.map((r: any) => ({
    ...r,
    profile: profileMap[r.user_id] ?? null,
  }))
}

async function resolveReport(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const admin_notes = formData.get('admin_notes') as string
  await adminClient
    .from('concern_reports')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), admin_notes })
    .eq('id', id)
  revalidatePath('/admin/concern-reports')
}

export default async function AdminConcernReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'open' } = await searchParams
  const reports = await getConcernReports(tab)

  const openCount = tab === 'open' ? reports.length : reports.filter((r: any) => r.status === 'open').length

  return (
    <div className="space-y-6 text-gray-800">

      {/* ── Header ── */}
      <div className="bg-white pt-6 px-10 rounded-b-xl shadow-sm border-b border-gray-200 -mt-8 mx-[-2rem] mb-6 relative pb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-red-100 border border-red-200 text-red-700 rounded flex items-center justify-center font-bold text-lg shadow-sm">
            ⚠
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              Concern Reports
              {tab === 'open' && openCount > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {openCount} open
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Customer-reported reactions and product concerns — respond within a few hours
            </p>
          </div>
        </div>
      </div>

      {/* ── Urgency Banner (only when open reports exist) ── */}
      {tab === 'open' && openCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-600 text-lg flex-shrink-0">⚠</span>
          <p className="text-sm text-red-700 font-medium">
            <strong>{openCount} open {openCount === 1 ? 'report' : 'reports'}</strong> — these customers are waiting for a response.
            Contact them directly via WhatsApp or email.
          </p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'open',     label: `Open` },
          { key: 'resolved', label: 'Resolved' },
          { key: 'all',      label: 'All' },
        ].map(t => (
          <a
            key={t.key}
            href={`/admin/concern-reports?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-red-500 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* ── Reports List ── */}
      {reports.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 font-medium">No {tab === 'all' ? '' : tab} concern reports.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {reports.map((report: any) => {
            const profile   = report.profile as any
            const severity  = SEVERITY_CONFIG[report.severity] ?? SEVERITY_CONFIG.mild
            const isOpen    = report.status === 'open'

            return (
              <div
                key={report.id}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${
                  isOpen ? 'border-red-200' : 'border-gray-100'
                }`}
              >
                {/* Report Header */}
                <div className={`px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${isOpen ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${severity.bg} ${severity.text} ${severity.border}`}>
                      {severity.label}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{profile?.full_name ?? 'Unknown Customer'}</p>
                      <p className="text-xs text-gray-500">{profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Formula</p>
                      <p className="text-sm font-bold text-gray-700">{report.formula_code ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Day</p>
                      <p className="text-sm font-bold text-gray-700">{report.day_of_protocol ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Submitted</p>
                      <p className="text-sm font-bold text-gray-700">
                        {new Date(report.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isOpen ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {isOpen ? 'OPEN' : 'RESOLVED'}
                    </span>
                  </div>
                </div>

                {/* Report Body */}
                <div className="px-6 py-5 grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Suspected Product</p>
                      <p className="text-sm text-gray-800 font-medium">{PRODUCT_LABELS[report.suspected_product] ?? report.suspected_product}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer's Report</p>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                        <p className="text-sm text-gray-700 leading-relaxed">"{report.description}"</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {profile?.phone && (
                        <a
                          href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          📱 WhatsApp Customer
                        </a>
                      )}
                      {profile?.email && (
                        <a
                          href={`mailto:${profile.email}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors"
                        >
                          ✉ Email Customer
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Photo + Resolve */}
                  <div className="flex flex-col gap-4">
                    {report.photo_url && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Photo</p>
                        <a href={report.photo_url} target="_blank" rel="noreferrer">
                          <img
                            src={report.photo_url}
                            alt="Reaction photo"
                            className="w-full max-h-52 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                          />
                        </a>
                      </div>
                    )}

                    {isOpen ? (
                      <form action={resolveReport} className="flex flex-col gap-3">
                        <input type="hidden" name="id" value={report.id} />
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                            Admin Notes (optional)
                          </label>
                          <textarea
                            name="admin_notes"
                            rows={3}
                            placeholder="What action was taken? e.g. Advised to pause formula for 48h, referred to dermatologist..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-green-400 transition-colors resize-y"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✓ Mark as Resolved
                        </button>
                      </form>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Resolved</p>
                        <p className="text-xs text-gray-500 mb-2">
                          {report.resolved_at ? new Date(report.resolved_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                        {report.admin_notes && (
                          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                            <p className="text-xs text-green-800 leading-relaxed">{report.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
