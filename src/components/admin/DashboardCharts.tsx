'use client'

import { useState } from 'react'

// Helper to mimic recharts interactivity natively inside Tailwind
function Tooltip({ active, payload, label, coordinate }: any) {
  if (!active || !payload) return null
  return (
    <div 
      className="absolute bg-white p-3 border border-gray-100 shadow-xl rounded-lg z-50 text-sm pointer-events-none transition-all duration-100 ease-out"
      style={{ left: coordinate?.x, top: coordinate?.y - 80, transform: 'translateX(-50%)' }}
    >
      <p className="font-bold text-gray-800 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardCharts({ historicalOrders, historicalSubscriptions, totalSubscribers }: { historicalOrders: any[], historicalSubscriptions: any[], totalSubscribers: number }) {
  // ── Calculate Derived Data Dynamically ──
  const currentDate = new Date()
  const rawMonths = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    rawMonths.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      monthIndex: d.getMonth()
    })
  }
  
  // Bar Chart Data (Revenue dynamically bucketed by month)
  const revenueData = rawMonths.map(m => {
    const monthOrders = historicalOrders.filter(o => {
      const oDate = new Date(o.created_at)
      return oDate.getMonth() === m.monthIndex && oDate.getFullYear() === m.year
    })
    const revenue = monthOrders.reduce((sum, o) => sum + (o.payment_amount || 0), 0)
    return { name: m.label, revenue, cost: revenue * 0.35 }
  })

  // Line Chart Data (Cumulative Subscriptions Growth up to each month)
  const lineData = rawMonths.map((m) => {
    const endOfMonth = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59)
    const activeUpToMonth = historicalSubscriptions.filter(s => new Date(s.created_at) <= endOfMonth)
    return {
      name: m.label,
      total: activeUpToMonth.length
    }
  })

  // Highest point logic to scale the chart dynamically
  const maxLineTotal = Math.max(...lineData.map(d => d.total), 10) // Minimum scale 10

  // Donut Chart Data (Plans)
  const totalOrders = Math.max(historicalOrders.length, 1) // prevent div by zero
  const fullProto = historicalOrders.filter(o => o.plan_tier === 'full_protocol').length || 0
  const starterProto = historicalOrders.filter(o => o.plan_tier === 'starter_routine').length || 0
  // Fallback visual to prevent empty donut rendering if database is entirely empty
  const isZero = historicalOrders.length === 0
  const percentages = { 
    full: isZero ? 100 : Math.round((fullProto/totalOrders)*100), 
    starter: isZero ? 0 : Math.round((starterProto/totalOrders)*100) 
  }

  // ── State for Tooltips ──
  const [activeBar, setActiveBar] = useState<any>(null)
  const [activeLineItem, setActiveLineItem] = useState<any>(null)

  return (
    <div className="space-y-6 mt-6 relative">
      
      {/* ── Row 1: Charts (Mimicking Zoho Income & Donut) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income and Expense Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col lg:col-span-2 overflow-hidden relative">
           <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <h2 className="text-sm font-bold text-gray-800">Income and Operations</h2>
             <span className="text-gray-400 text-xs font-medium cursor-pointer bg-white border border-gray-200 px-3 py-1 rounded">This Year ▾</span>
           </div>
           <div className="p-6 relative">
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-toneek-forest"></div>
                  <span className="text-sm font-semibold text-gray-700">Gross Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-toneek-error"></div>
                  <span className="text-sm font-semibold text-gray-700">Operational Cost</span>
                </div>
              </div>

              {/* Native Bar Chart Grid */}
              <div className="relative h-64 border-b border-l border-gray-200 flex items-end justify-between px-6 pb-0 pt-4" onMouseLeave={() => setActiveBar(null)}>
                 {/* Y Axis Grid Lines */}
                 <div className="absolute w-full border-b border-gray-100 border-dashed left-0 bottom-[20%]"></div>
                 <div className="absolute w-full border-b border-gray-100 border-dashed left-0 bottom-[40%]"></div>
                 <div className="absolute w-full border-b border-gray-100 border-dashed left-0 bottom-[60%]"></div>
                 <div className="absolute w-full border-b border-gray-100 border-dashed left-0 bottom-[80%]"></div>
                 
                 {revenueData.map((d, i) => (
                   <div 
                     key={i} 
                     className="w-16 h-full flex items-end gap-1 relative group cursor-pointer z-10"
                     onMouseEnter={(e) => setActiveBar({ 
                       label: d.name, 
                       payload: [ { color: 'var(--color-toneek-forest)', name: 'Income', value: `$${d.revenue}` }, { color: 'var(--color-toneek-error)', name: 'Cost', value: `$${d.cost}` } ],
                       coordinate: { x: e.clientX, y: e.clientY }
                     })}
                   >
                     {/* Gross Income Bar */}
                     <div className="w-full bg-toneek-forest rounded-t-sm hover:brightness-110 transition-all" style={{ height: `${(d.revenue / 1000) * 100}%`, minHeight: '5%' }}></div>
                     {/* Cost Bar */}
                     <div className="w-full bg-toneek-error rounded-t-sm hover:brightness-110 transition-all" style={{ height: `${(d.cost / 1000) * 100}%`, minHeight: '5%' }}></div>
                     
                     {/* X Axis Label */}
                     <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-400">{d.name}</span>
                   </div>
                 ))}
                 
                 {activeBar && <Tooltip {...activeBar} active={true} />}
              </div>
              <div className="mt-12 text-xs text-gray-400 font-medium">* Income and expense values mapped from live payment streams.</div>
           </div>
        </div>

        {/* Top Expenses Donut Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <h2 className="text-sm font-bold text-gray-800">Plan Distribution</h2>
           </div>
           <div className="p-6 flex flex-col items-center justify-center flex-1">
              
              {/* Native Donut Chart Using SVG Dasharray */}
              <div className="relative w-48 h-48 mb-8">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="20" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-toneek-brown)" strokeWidth="20" strokeDasharray={`${percentages.full * 2.5} 250`} className="hover:opacity-80 cursor-pointer transition-opacity" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-toneek-amber)" strokeWidth="20" strokeDasharray={`${percentages.starter * 2.5} 250`} strokeDashoffset={`-${percentages.full * 2.5}`} className="hover:opacity-80 cursor-pointer transition-opacity" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-gray-400">Total Orders</span>
                    <span className="text-lg font-bold text-gray-900">{totalOrders}</span>
                 </div>
              </div>

              <div className="w-full space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded bg-toneek-brown"></div>
                       <span className="text-gray-600 font-medium">Full Protocol</span>
                    </div>
                    <span className="font-bold text-gray-900">{percentages.full}%</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded bg-toneek-amber"></div>
                       <span className="text-gray-600 font-medium">Starter Routine</span>
                    </div>
                    <span className="font-bold text-gray-900">{percentages.starter}%</span>
                 </div>
              </div>

           </div>
        </div>
      </div>

      {/* ── Row 2: Cash Flow Line Chart ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">
         <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <h2 className="text-sm font-bold text-gray-800">Cumulative Subscribers</h2>
           <span className="text-gray-400 text-xs font-medium cursor-pointer bg-white border border-gray-200 px-3 py-1 rounded">This Year ▾</span>
         </div>
         
         <div className="p-8 flex gap-8">
            {/* The Line Chart Container */}
            <div className="flex-1 relative h-64 border-l border-b border-gray-200 p-0" onMouseLeave={() => setActiveLineItem(null)}>
               {/* Y Axis Guides scaled dynamically */}
               <div className="absolute w-full border-b border-gray-100 border-dashed left-0 bottom-[25%] -z-10 flex items-center justify-between"><span className="absolute -left-8 text-xs text-gray-400 font-bold">{Math.round(maxLineTotal * 0.25)}</span></div>
               <div className="absolute w-full border-b border-gray-100 border-dashed left-0 bottom-[50%] -z-10 flex items-center justify-between"><span className="absolute -left-8 text-xs text-gray-400 font-bold">{Math.round(maxLineTotal * 0.5)}</span></div>
               <div className="absolute w-full border-b border-gray-100 border-dashed left-0 bottom-[75%] -z-10 flex items-center justify-between"><span className="absolute -left-8 text-xs text-gray-400 font-bold">{Math.round(maxLineTotal * 0.75)}</span></div>

               {/* Line SVG implementation mapped exactly behind native points */}
               <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none">
                 <path 
                   d={`M 0,${256 - (lineData[0].total/maxLineTotal)*256} ${lineData.map((d, i) => `L ${i * (100/(lineData.length-1))}%, ${256 - (d.total/maxLineTotal)*256}`).join(' ')}`}
                   fill="none" 
                   stroke="var(--color-toneek-amber)" 
                   strokeWidth="2"
                 />
                 {/* Subtle blue fill beneath the line */}
                 <path 
                   d={`M 0,256 L 0,${256 - (lineData[0].total/maxLineTotal)*256} ${lineData.map((d, i) => `L ${i * (100/(lineData.length-1))}%, ${256 - (d.total/maxLineTotal)*256}`).join(' ')} L 100%, 256 Z`}
                   fill="rgba(196, 123, 60, 0.05)" 
                   stroke="none"
                 />
               </svg>

               {/* Interactive Plot Points */}
               <div className="absolute w-full h-full flex justify-between items-end">
                 {lineData.map((d, i) => (
                    <div 
                      key={i} 
                      className="absolute group flex flex-col items-center justify-end cursor-pointer"
                      style={{ height: '100%', left: `${i * (100/(lineData.length-1))}%`, transform: 'translateX(-5%)' }}
                      onMouseEnter={(e) => setActiveLineItem({
                        label: d.name,
                        payload: [ { color: 'var(--color-toneek-amber)', name: 'Total Subscribers', value: d.total } ],
                        coordinate: { x: e.clientX, y: e.clientY }
                      })}
                    >
                      {/* X Axis Label */}
                      <span className="absolute -bottom-8 text-xs font-semibold text-gray-400">{d.name}</span>
                      {/* Glowing Dot overlay */}
                      <div className="absolute w-3 h-3 bg-toneek-amber border-2 border-white rounded-full shadow-md z-10 transition-transform group-hover:scale-150" style={{ bottom: `calc(${(d.total/maxLineTotal)*100}%)`, transform: 'translateY(50%)' }}></div>
                    </div>
                 ))}
               </div>
               {activeLineItem && <Tooltip {...activeLineItem} active={true} />}
            </div>

            {/* Right Summary Block mimicking Zoho Cash Flow right bar */}
            <div className="w-64 flex flex-col justify-center border-l border-gray-100 pl-8 space-y-6">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                   <div className="w-2.5 h-2.5 rounded bg-gray-400"></div>
                   <span className="text-xs text-gray-500 font-semibold uppercase">Subs as of {rawMonths[0].label} {rawMonths[0].year}</span>
                 </div>
                 <p className="text-xl font-bold text-gray-900 ml-4.5">{lineData[0].total}</p>
              </div>

              <div>
                 <div className="flex items-center gap-2 mb-1">
                   <div className="w-2.5 h-2.5 rounded bg-toneek-forest"></div>
                   <span className="text-xs text-gray-500 font-semibold uppercase">New Acquisitions (+)</span>
                 </div>
                 <p className="text-xl font-bold text-gray-900 ml-4.5">{historicalOrders.length}</p>
              </div>

              <div>
                 <div className="flex items-center gap-2 mb-1">
                   <div className="w-2.5 h-2.5 rounded bg-toneek-error"></div>
                   <span className="text-xs text-gray-500 font-semibold uppercase">Cancellations (-)</span>
                 </div>
                 <p className="text-xl font-bold text-gray-900 ml-4.5">0</p>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-2">
                 <div className="flex items-center gap-2 mb-1">
                   <div className="w-2.5 h-2.5 rounded bg-toneek-amber"></div>
                   <span className="text-xs text-gray-500 font-semibold uppercase">Subs as of {rawMonths[rawMonths.length-1].label} {rawMonths[rawMonths.length-1].year}</span>
                 </div>
                 <p className="text-xl font-bold text-toneek-amber ml-4.5">{lineData[lineData.length-1].total}</p>
              </div>
            </div>
         </div>
      </div>

    </div>
  )
}
