'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/dashboard/formula'
      }
    })
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send login link.')
      }

      setStatus('success')
    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-toneek-cream font-sans">
      
      {/* Premium Header matching the dashboard style */}
      <header className="h-20 border-b border-toneek-brown/10 flex items-center px-6 md:px-12 bg-white">
        <a href="/">
          <img src="/logo.svg" alt="Toneek" className="h-12 w-auto object-contain cursor-pointer" />
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-toneek-brown/5 border border-toneek-brown/10">
          <div className="text-center mb-8">
            <div className="h-14 w-14 bg-toneek-amber/10 text-toneek-amber rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✨
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Enter your email to access your Toneek dashboard.</p>
          </div>

          {status === 'success' ? (
            <div className="bg-toneek-sage/20 border border-toneek-forest/30 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">📬</div>
              <h3 className="font-bold text-gray-900 mb-1">Check your inbox</h3>
              <p className="text-sm text-gray-600">
                We've sent a secure login link to <br/>
                <span className="font-medium text-gray-900">{email}</span>
              </p>
              <p className="text-xs text-gray-400 mt-4">
                The link expires in 24 hours. You can close this tab.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-toneek-brown focus:border-toneek-brown outline-none transition-all placeholder-gray-400 text-gray-900"
                  placeholder="name@example.com"
                />
              </div>

              {status === 'error' && (
                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-toneek-brown hover:bg-[#2C130A] text-white font-bold py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-md shadow-toneek-brown/20"
              >
                {status === 'loading' ? 'Sending Link...' : 'Send Login Link'}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} Toneek. All rights reserved.</p>
      </footer>
    </div>
  )
}
