'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

export default function AuthPage() {
  const [tab, setTab]           = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading]   = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  // If already logged in, go straight to home
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.replace('/')
      } else {
        setChecking(false)
      }
    })
  }, [])

  async function handleLogin() {
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    window.location.href = '/'
  }

  async function handleSignup() {
    setError(''); setLoading(true)
    if (!username.trim()) { setError('Username is required'); setLoading(false); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } }
    })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        display_name: username,
        followers_count: 0,
        following_count: 0,
        tweets_count: 0,
        verified: false,
      })
    }

    if (data.session) {
      window.location.href = '/'
    } else {
      setSuccess('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-x-black flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-x-light fill-current animate-pulse">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-x-black flex">
      {/* Left — X logo (desktop) */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-72 h-72 text-x-light fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>

      {/* Right — Auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-x-light fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-x-light mb-8">
            {tab === 'login' ? 'Sign in to X' : 'Join X today'}
          </h1>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              {tab === 'signup' && (
                <input
                  className="input-field"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  maxLength={20}
                />
              )}
              <input
                className="input-field"
                placeholder="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input
                className="input-field"
                placeholder="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              {success && (
                <p className="text-x-green text-sm text-center">{success}</p>
              )}

              <button
                className="btn-primary w-full py-3 text-base mt-2"
                onClick={tab === 'login' ? handleLogin : handleSignup}
                disabled={loading}
              >
                {loading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-x-border"/>
            <span className="text-x-gray text-sm">or</span>
            <div className="flex-1 h-px bg-x-border"/>
          </div>

          <p className="text-x-gray text-sm text-center">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              className="text-x-blue hover:underline font-semibold"
              onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            >
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}
