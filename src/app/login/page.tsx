'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/auth/confirm?next=/admin`,
      },
    })

    if (error) {
      console.error(error)
      setStatus('error')
      setErrorMessage(error.message)
    } else {
      setStatus('success')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" style={{ color: '#0f0f0f' }}>
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Admin Access</h1>
        <p className="text-gray-500 mb-6 text-center text-sm">Enter your email to receive a secure login link.</p>

        {status === 'success' ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200 text-sm text-center">
             ✅ Check your inbox for the login link! It will redirect you straight to the admin dashboard.
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 outline-none"
                placeholder="admin@example.com"
              />
            </div>
            {status === 'error' && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
