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

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-green-600">🛝 PlayFinder</Link>
        <div className="flex items-center gap-3">
          <Link href="/" className={`text-sm font-medium ${pathname === '/' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>Map</Link>
          <Link href="/list" className={`text-sm font-medium ${pathname === '/list' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>List</Link>
          {user ? (
            <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-full font-medium">
              Sign in
            </button>
          )}
        </div>
      </nav>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
