'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Activity, 
  Settings, 
  Bell, 
  Search, 
  FlaskConical,
  Package,
  Users,
  CreditCard,
  Stethoscope,
  LogOut,
  Menu,
  ChevronLeft,
  Loader2
} from 'lucide-react'

export default function AdminShell({ children, userProfile }: { children: React.ReactNode, userProfile: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeDropdown, setActiveDropdown] = useState<'notifications' | 'settings' | 'profile' | 'search' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [])

  // Handle Global Search Input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    if (query.trim().length < 2) {
      setSearchResults([])
      setActiveDropdown(null)
      return
    }

    setActiveDropdown('search')
    setIsSearching(true)

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    
    searchTimeoutRef.current = setTimeout(async () => {
       try {
          const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
          const data = await res.json()
          setSearchResults(data.results || [])
       } catch (err) {
          setSearchResults([])
       } finally {
          setIsSearching(false)
       }
    }, 400)
  }

  const navigateToResult = (url: string) => {
    setActiveDropdown(null)
    setSearchQuery('')
    router.push(url)
  }

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
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 z-20`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {isSidebarOpen ? (
            <span className="text-xl font-bold text-white tracking-tight ml-2 truncate">Toneek Admin</span>
          ) : (
             <span className="text-xl font-bold text-white tracking-tight mx-auto">TA</span>
          )}
          <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
             {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 flex flex-col gap-2 px-3">
          {links.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#b8895a] text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${!isSidebarOpen ? 'justify-center' : ''}`}
                title={!isSidebarOpen ? link.name : undefined}
              >
                <Icon size={20} className={isActive ? 'text-white flex-shrink-0' : 'text-slate-400 flex-shrink-0'} />
                {isSidebarOpen && <span className="truncate">{link.name}</span>}
              </Link>
            )
          })}
        </div>
        <div className="p-3 border-t border-slate-800">
          <Link 
             href="/dashboard" 
             className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
             title={!isSidebarOpen ? "Exit to Platform" : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {isSidebarOpen && <span className="truncate">Exit to Platform</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10 flex-shrink-0 w-full relative">
          <div className="flex flex-1 items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="relative w-96 flex-shrink-0" ref={activeDropdown === 'search' ? dropdownRef : null}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search size={16} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearchInput}
                onFocus={() => { if (searchQuery.trim().length >= 2) setActiveDropdown('search') }}
                placeholder="Search customers, orders..." 
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-slate-50 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b8895a] focus:border-[#b8895a] sm:text-sm transition-colors"
              />
              
              {/* Search Results Dropdown Popover */}
              {activeDropdown === 'search' && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden z-50">
                   {isSearching ? (
                     <div className="p-4 flex items-center justify-center text-sm text-gray-500 gap-2">
                       <Loader2 size={16} className="animate-spin text-[#b8895a]" /> Searching Database...
                     </div>
                   ) : searchResults.length > 0 ? (
                     <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                       {searchResults.map((result, idx) => (
                         <li 
                           key={idx} 
                           onClick={() => navigateToResult(result.url)}
                           className="p-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 transition-colors"
                         >
                           <div className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${result.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                             {result.type === 'customer' ? <Users size={14} /> : <Package size={14} />}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-semibold text-gray-800 truncate">{result.title}</p>
                             <p className="text-xs text-gray-500 truncate">{result.secondary}</p>
                           </div>
                         </li>
                       ))}
                     </ul>
                   ) : (
                     <div className="p-4 text-sm text-gray-500 text-center">
                        No matches found for "{searchQuery}"
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end" ref={activeDropdown !== 'search' ? dropdownRef : null}>
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
                className={`p-2 rounded-full transition-colors relative ${activeDropdown === 'notifications' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>
              
              {activeDropdown === 'notifications' && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 font-bold text-gray-800">Notifications</div>
                  <div className="p-4 text-sm text-gray-500 text-center">No new alerts to check right now!</div>
                </div>
              )}
            </div>

            {/* Settings Gear */}
            <div className="relative ml-2">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'settings' ? null : 'settings')}
                className={`p-2 rounded-full transition-colors ${activeDropdown === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <Settings size={20} />
              </button>

               {activeDropdown === 'settings' && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Platform Settings</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Lab Configuration</button>
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-gray-200 mx-3"></div>
            
            {/* Admin Profile */}
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 transition-colors"
               >
                 <div className="h-8 w-8 rounded-full bg-[#b8895a] flex items-center justify-center text-white font-bold text-sm">
                   {userProfile?.full_name?.charAt(0) || 'A'}
                 </div>
                 <span className="text-sm font-medium text-gray-700">{userProfile?.full_name || 'Admin'}</span>
              </button>

              {activeDropdown === 'profile' && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <a href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Exit Admin Mode</a>
                  <a href="/api/auth/signout" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium border-t border-gray-50 mt-1">Sign out</a>
                </div>
              )}
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
