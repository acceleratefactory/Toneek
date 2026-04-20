'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNav() {
  const pathname = usePathname()

  const links = [
    { name: 'System Health', href: '/admin' },
    { name: 'Production', href: '/admin/production' },
    { name: 'Orders', href: '/admin/orders' },
    { name: 'Customers', href: '/admin/customers' },
    { name: 'Payments', href: '/admin/payments' },
    { name: 'Outcomes', href: '/admin/outcomes' }
  ]

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900 tracking-tight">Toneek Admin</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-green-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Exit to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
