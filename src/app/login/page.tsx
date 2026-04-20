'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password
    })

    if (error) {
      console.error(error)
      setStatus('error')
      setErrorMessage(error.message)
    } else if (data.session) {
       // Save to server-side cookies so Next.js middleware knows we are logged in
       const res = await fetch('/api/auth/session', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
               access_token: data.session.access_token, 
               refresh_token: data.session.refresh_token 
           }),
       })

       if (res.ok) {
           setStatus('success')
           window.location.href = '/admin'
       } else {
           setStatus('error')
           setErrorMessage('Authentication succeeded but failed to set secure cookies.')
       }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" style={{ color: '#0f0f0f' }}>
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Admin Access</h1>
        <p className="text-gray-500 mb-6 text-center text-sm">Secure password authentication.</p>

        {status === 'success' ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200 text-sm text-center">
             ✅ Login successful! Redirecting to dashboard...
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
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 outline-none"
                placeholder="••••••••"
              />
            </div>
            {status === 'error' && (
              <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded">{errorMessage}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 mt-4"
            >
              {status === 'loading' ? 'Authenticating...' : 'Log In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
