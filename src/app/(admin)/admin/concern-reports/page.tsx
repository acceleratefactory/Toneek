'use client'

// src/app/(admin)/admin/concern-reports/page.tsx
// Admin view for customer concern/reaction reports.
// Resolve action fires email + WhatsApp back to the customer.

import { useEffect, useState } from 'react'

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

export default function AdminConcernReportsPage() {
  const [tab, setTab]         = useState('open')
  const [reports, setReports] = useState<any[]>([])
  const [systemFlags, setSystemFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [formulaDecision, setFormulaDecision] = useState<Record<string, string>>({})

  useEffect(() => {
    setLoading(true)
    fetch(`/api/report-concern/list?tab=${tab}`)
      .then(r => r.json())
      .then(d => { 
        setReports(d.reports ?? [])
        setSystemFlags(d.systemFlags ?? [])
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }, [tab])

  const openCount = tab === 'open' ? reports.length : reports.filter(r => r.status === 'open').length

  const handleResolve = async (reportId: string) => {
    setResolving(reportId)
    const res = await fetch('/api/report-concern/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_id:        reportId,
        admin_notes:      adminNotes[reportId] ?? '',
        formula_decision: formulaDecision[reportId] ?? 'keep_conservative',
      }),
    })
    if (res.ok) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved', admin_notes: adminNotes[reportId] } : r))
    }
    setResolving(null)
  }

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
              {openCount > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {openCount} open
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Customer-reported reactions — respond within a few hours. Resolving sends an automatic response to the customer.
            </p>
          </div>
        </div>
      </div>

      {/* ── System Alerts (Phase F) ── */}
      {systemFlags.length > 0 && (
        <div className="bg-red-900 border border-red-950 rounded-xl p-5 shadow-sm text-white">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <span className="text-xl">🚨</span> System Intelligence Flags
          </h2>
          <div className="flex flex-col gap-3">
            {systemFlags.map(flag => (
              <div key={flag.id} className="bg-white/10 p-3 rounded-lg flex items-center gap-4">
                <span className="font-bold text-red-200">{flag.formula_code}</span>
                <span className="text-sm flex-1">
                  {flag.adverse_report_count} adverse reports received across different customers. Chemist concentration review required.
                </span>
                <span className="text-xs text-white/50">{new Date(flag.flagged_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Urgency Banner ── */}
      {tab === 'open' && openCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-600 text-lg flex-shrink-0">⚠</span>
          <p className="text-sm text-red-700 font-medium">
            <strong>{openCount} open {openCount === 1 ? 'report' : 'reports'}</strong> — write your clinical response in the Admin Notes box and click <strong>Mark as Resolved</strong>. The customer will be notified automatically via email and WhatsApp.
          </p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: 'open',     label: 'Open' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'all',      label: 'All' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-red-500 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Reports List ── */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading reports…</div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 font-medium">No {tab === 'all' ? '' : tab} concern reports.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {reports.map((report: any) => {
            const profile  = report.profile ?? {}
            const severity = SEVERITY_CONFIG[report.severity] ?? SEVERITY_CONFIG.mild
            const isOpen   = report.status === 'open'

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
                      <p className="font-bold text-gray-900">{profile.full_name ?? 'Unknown Customer'}</p>
                      <p className="text-xs text-gray-500">{profile.email ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Formula</p>
                      <p className="text-sm font-bold text-gray-700">{report.formula_code && report.formula_code !== 'N/A' ? report.formula_code : '—'}</p>
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

                    {/* Contact buttons */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Customer</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.phone && (
                          <a
                            href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                          >
                            📱 WhatsApp
                          </a>
                        )}
                        {profile.email && (
                          <a
                            href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(profile.email)}&su=${encodeURIComponent(`Re: Your Toneek Concern Report`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-lg hover:bg-gray-900 transition-colors"
                          >
                            ✉ Email
                          </a>
                        )}
                        {profile.email && (
                          <button
                            onClick={() => navigator.clipboard.writeText(profile.email)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            📋 Copy Email
                          </button>
                        )}
                      </div>
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
                      <div className="flex flex-col gap-3">

                        {/* ── Formula Decision ── */}
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            Formula Decision After Resolution
                          </label>
                          <div className="flex flex-col gap-2">
                            {[
                              {
                                value: 'keep_conservative',
                                label: 'Keep conservative formula',
                                desc:  'Customer stays on the barrier-safe formula. Recommended if reaction was moderate or severe.',
                                color: 'border-amber-300 bg-amber-50',
                                active: 'border-amber-500 bg-amber-100',
                              },
                              {
                                value: 'restore_original',
                                label: 'Restore original formula',
                                desc:  'Reverts to the formula the customer had before the concern was reported. Use only when reaction was mild and resolved.',
                                color: 'border-blue-200 bg-blue-50',
                                active: 'border-blue-500 bg-blue-100',
                              },
                              {
                                value: 'flag_for_chemist',
                                label: 'Flag for chemist review',
                                desc:  'Keeps conservative formula and flags this customer for a concentration adjustment review by your chemist.',
                                color: 'border-purple-200 bg-purple-50',
                                active: 'border-purple-500 bg-purple-100',
                              },
                            ].map(opt => {
                              const selected = (formulaDecision[report.id] ?? 'keep_conservative') === opt.value
                              return (
                                <label
                                  key={opt.value}
                                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selected ? opt.active : opt.color}`}
                                >
                                  <input
                                    type="radio"
                                    name={`formula_decision_${report.id}`}
                                    value={opt.value}
                                    checked={selected}
                                    onChange={() => setFormulaDecision(prev => ({ ...prev, [report.id]: opt.value }))}
                                    className="mt-0.5 flex-shrink-0"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-gray-800">{opt.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>

                        {/* ── Clinical Response / Admin Notes ── */}
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                            Clinical Response / Admin Notes
                          </label>
                          <p className="text-xs text-gray-400 mb-2">This note will be sent to the customer automatically when you resolve.</p>
                          <textarea
                            value={adminNotes[report.id] ?? ''}
                            onChange={e => setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                            rows={4}
                            placeholder="e.g. We recommend pausing the formula for 48 hours. The tingling you experienced is consistent with an initial adjustment reaction. Resume on Day 6 with a patch test first..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-green-400 transition-colors resize-y"
                          />
                        </div>
                        <button
                          onClick={() => handleResolve(report.id)}
                          disabled={resolving === report.id}
                          className={`w-full py-2.5 text-white text-sm font-bold rounded-lg transition-colors ${
                            resolving === report.id ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {resolving === report.id ? 'Resolving & Notifying Customer…' : '✓ Mark as Resolved — Customer Will Be Notified'}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Resolved</p>
                        <p className="text-xs text-gray-500 mb-2">
                          {report.resolved_at ? new Date(report.resolved_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                        {report.admin_notes && (
                          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                            <p className="text-xs font-bold text-green-700 mb-1">Response sent to customer:</p>
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
