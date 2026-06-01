'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  if (!isOpen) return null

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-1">Sign in to rate</h2>
        <p className="text-gray-500 text-sm mb-6">Create a free account to rate playgrounds</p>

        {sent ? (
          <p className="text-green-600 text-center py-4">✅ Check your email for a magic link!</p>
        ) : (
          <>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 mb-4 hover:bg-gray-50 font-medium"
            >
              <span>🔵</span> Continue with Google
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleEmailLogin}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
          </>
        )}

        <button onClick={onClose} className="mt-4 w-full text-gray-400 text-sm hover:text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
