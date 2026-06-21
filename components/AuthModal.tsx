'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  isOpen: boolean
  onClose: () => void
  /** Path to return to after sign-in, e.g. "/playground/abc". Must start with "/". */
  next?: string
}

export default function AuthModal({ isOpen, onClose, next }: Props) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  if (!isOpen) return null

  const callbackUrl = () => {
    const base = `${window.location.origin}/auth/callback`
    return next ? `${base}?next=${encodeURIComponent(next)}` : base
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    })
    setSent(true)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-line" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-park rounded-xl flex items-center justify-center mx-auto mb-3 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="w-6 h-6" aria-hidden="true">
              <path d="M6 20V6M9 20V6M6 9.5h3M6 13.5h3M6 17.5h3" />
              <path d="M9 6c5 1 8.2 6 9 14" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-extrabold text-ink tracking-tight">Sign in to rate</h2>
          <p className="text-moss text-sm mt-1">Create a free account to rate playgrounds</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <h3 className="font-display font-bold text-ink">Check your email</h3>
            <p className="text-moss text-sm mt-1">We sent a magic link to <strong className="text-ink">{email}</strong></p>
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-line rounded-[10px] py-3 mb-4 hover:bg-sand font-medium text-ink transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-line" />
              <span className="text-moss text-xs font-medium uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-line" />
            </div>

            <form onSubmit={handleEmailLogin}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-line rounded-[10px] px-4 py-3 mb-3 text-sm focus:outline-2 focus:outline-park placeholder:text-moss"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-park hover:bg-park-deep text-white rounded-[10px] py-3 font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
          </>
        )}

        <button onClick={onClose} className="mt-4 w-full text-moss text-sm hover:text-ink transition-colors py-1">
          Cancel
        </button>
      </div>
    </div>
  )
}
