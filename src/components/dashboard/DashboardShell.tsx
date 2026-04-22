'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LogOut,
  Menu,
  ChevronLeft,
  Moon,
  Sun,
  FlaskConical,
  Package,
  CheckSquare,
  User,
  CreditCard
} from 'lucide-react'

const NAV_ITEMS = [
    { href: '/dashboard',              label: 'My Formula',  icon: FlaskConical, id: 'nav-formula'  },
    { href: '/dashboard/orders',       label: 'My Orders',   icon: Package,      id: 'nav-orders'   },
    { href: '/dashboard/checkin',      label: 'Check-in',    icon: CheckSquare,  id: 'nav-checkin'  },
    { href: '/dashboard/profile',      label: 'My Profile',  icon: User,         id: 'nav-profile'  },
    { href: '/dashboard/subscription', label: 'Plan',        icon: CreditCard,   id: 'nav-plan'     },
]

export default function DashboardShell({ children, userProfile }: { children: React.ReactNode, userProfile: any }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeDropdown, setActiveDropdown] = useState<'profile' | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Theme Toggle Logic
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  useEffect(() => {
    // Check if system preference is dark originally, but default to light if not set
    const savedTheme = localStorage.getItem('toneek-theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
      document.documentElement.style.setProperty('color-scheme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.setProperty('color-scheme', 'light')
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.setProperty('color-scheme', 'dark')
      localStorage.setItem('toneek-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.setProperty('color-scheme', 'light')
      localStorage.setItem('toneek-theme', 'light')
    }
  }

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
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/assessment'
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${isDarkMode ? 'bg-[#1A1210] text-[#F0E6DF]' : 'bg-toneek-cream text-toneek-brown'}`}>
      {/* Sidebar - Matches Admin style */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 ease-in-out bg-toneek-brown border-r border-[#2C130A] flex flex-col flex-shrink-0 z-20`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#2C130A]">
          {isSidebarOpen ? (
            <img src="/logo-dark.svg" alt="Toneek" className="h-7 w-auto ml-2 object-contain" />
          ) : (
             <span className="text-xl font-bold text-toneek-cream tracking-tight mx-auto">TK</span>
          )}
          <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="text-stone-400 hover:text-toneek-cream p-1 rounded-md hover:bg-[#2C130A] transition-colors hidden md:block"
          >
             {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 flex flex-col gap-2 px-3">
          {NAV_ITEMS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            return (
                <Link 
                  key={link.label} 
                  id={`sidebar-${link.id}`}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-toneek-amber text-[#000000] shadow-md' 
                      : 'text-stone-400 hover:bg-[#2C130A] hover:text-toneek-cream'
                  } ${!isSidebarOpen ? 'justify-center' : ''}`}
                  title={!isSidebarOpen ? link.label : undefined}
                >
                  <span className={`flex-shrink-0 ${isActive ? '' : 'opacity-80'}`}>
                    <link.icon size={20} />
                  </span>
                  {isSidebarOpen && <span className="truncate">{link.label}</span>}
                </Link>
              )
            })}
          </div>
          <div className="p-3 border-t border-[#2C130A]">
            <button 
               onClick={handleLogout}
               className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#D05C51] hover:bg-[#2C130A] transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
               title={!isSidebarOpen ? "Log Out" : undefined}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {isSidebarOpen && <span className="truncate">Log Out</span>}
            </button>
          </div>
        </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className={`h-16 border-b flex items-center justify-between px-6 z-10 flex-shrink-0 w-full relative transition-colors ${isDarkMode ? 'bg-[#261B18] border-[#3A2820]' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-1 items-center gap-4">
            {/* Mobile Menu Button - shows sidebar */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`md:hidden p-2 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Menu size={20} />
            </button>
            <h2 className={`font-bold text-lg hidden sm:block ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{NAV_ITEMS.find(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href)))?.label || 'Dashboard'}</h2>
          </div>
          
          <div className="flex items-center justify-end" ref={dropdownRef}>
            
            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors mr-3 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#302420]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className={`h-6 w-px mx-3 ${isDarkMode ? 'bg-[#3A2820]' : 'bg-gray-200'}`}></div>
            
            {/* User Profile */}
            <div className="relative">
              <button 
                onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
                className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-[#302420]' : 'hover:bg-gray-50'}`}
               >
                 <div className="h-8 w-8 rounded-full bg-toneek-amber flex items-center justify-center text-[#ffffff] font-bold text-sm">
                   {userProfile?.full_name?.charAt(0) || 'U'}
                 </div>
                 <span className={`text-sm font-medium hidden sm:block ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                   {userProfile?.full_name?.split(' ')[0] || 'Customer'}
                 </span>
              </button>

              {activeDropdown === 'profile' && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-1 z-50 overflow-hidden ${isDarkMode ? 'bg-[#261B18] border-[#3A2820]' : 'bg-white border-gray-100'}`}>
                  <Link href="/dashboard/profile" className={`block px-4 py-2 text-sm transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-[#302420]' : 'text-gray-700 hover:bg-gray-50'}`}>Account Details</Link>
                  <button onClick={handleLogout} className={`w-full text-left px-4 py-2 text-sm font-medium mt-1 transition-colors ${isDarkMode ? 'text-[#D05C51] hover:bg-[#D05C51]/10 border-t border-[#3A2820]' : 'text-red-600 hover:bg-red-50 border-t border-gray-50'}`}>Log Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Canvas */}
        <main className={`flex-1 overflow-auto p-4 sm:p-8 transition-colors ${isDarkMode ? 'bg-[#1A1210]' : 'bg-toneek-cream'}`}>
          <div className="max-w-4xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  )
}
