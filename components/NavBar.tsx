'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import AuthModal from './AuthModal'

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClient()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  const linkClass = (href: string) =>
    `text-sm font-semibold pb-0.5 border-b-2 transition-colors ${
      pathname === href ? 'text-white border-slide' : 'text-white/70 border-transparent hover:text-white'
    }`

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 h-14 bg-park border-b-[3px] border-park-deep px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-display font-extrabold text-xl text-white tracking-tight">
          <span className="w-7 h-7 rounded-lg bg-white/15 inline-flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="w-4 h-4" aria-hidden="true">
              <path d="M6 20V6M9 20V6M6 9.5h3M6 13.5h3M6 17.5h3" />
              <path d="M9 6c5 1 8.2 6 9 14" />
            </svg>
          </span>
          PlayFinder
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className={linkClass('/')}>Map</Link>
          <Link href="/list" className={linkClass('/list')}>List</Link>
          {user ? (
            <button onClick={handleSignOut} className="text-sm font-semibold text-white/85 border border-white/30 px-3.5 py-1.5 rounded-lg hover:border-white/60 transition-colors">
              Sign out
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="bg-slide text-park-deep text-sm font-bold px-4 py-1.5 rounded-lg hover:brightness-105 transition-[filter]">
              Sign in
            </button>
          )}
        </div>
      </nav>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
