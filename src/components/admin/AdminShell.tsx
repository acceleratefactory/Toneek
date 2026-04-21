'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Activity, 
  Settings, 
  Bell, 
  Search, 
  Plus,
  FlaskConical,
  Package,
  Users,
  CreditCard,
  Stethoscope,
  LogOut
} from 'lucide-react'

export default function AdminShell({ children, userProfile }: { children: React.ReactNode, userProfile: any }) {
  const pathname = usePathname()

  const links = [
    { name: 'System Health', href: '/admin', icon: Activity },
    { name: 'Production', href: '/admin/production', icon: FlaskConical },
    { name: 'Orders', href: '/admin/orders', icon: Package },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Outcomes', href: '/admin/outcomes', icon: Stethoscope }
  ]

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold text-white tracking-tight">Toneek Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
          {links.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#b8895a] text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                {link.name}
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut size={18} />
            Exit to Platform
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 flex-shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-96 ml-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search size={16} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search customers, orders..." 
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-slate-50 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b8895a] focus:border-[#b8895a] sm:text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-[#ef4444] text-white p-2 text-sm font-bold rounded shadow-sm hover:bg-red-600 transition-colors flex items-center gap-1">
              <Plus size={16} /> 
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <button className="text-gray-500 hover:text-gray-700 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
               <div className="h-8 w-8 rounded-full bg-[#b8895a] flex items-center justify-center text-white font-bold text-sm">
                 {userProfile?.full_name?.charAt(0) || 'A'}
               </div>
               <span className="text-sm font-medium text-gray-700 pr-2">{userProfile?.full_name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Canvas */}
        <main className="flex-1 overflow-auto bg-[#f9f9fb] p-8">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  )
}
