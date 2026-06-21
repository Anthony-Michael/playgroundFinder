'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RatingForm from '@/components/RatingForm'
import AuthModal from '@/components/AuthModal'
import type { Amenities } from '@/lib/supabase/types'

type Props = {
  playgroundId: string
  userId: string | null
  initialRating?: { stars: number; amenities: Amenities; comment: string | null } | null
}

export default function RatingFormWrapper({ playgroundId, userId, initialRating }: Props) {
  const [showAuth, setShowAuth] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const next = `/playground/${playgroundId}`

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="font-semibold text-park">Thanks for your rating!</p>
        <button onClick={() => { setSubmitted(false); router.refresh() }} className="mt-3 text-sm text-moss hover:text-ink underline transition-colors">
          Edit your rating
        </button>
      </div>
    )
  }

  if (!userId) {
    return (
      <>
        <div className="bg-white border border-line rounded-xl p-6 text-center">
          <p className="text-moss mb-4">Sign in to rate this playground</p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-park hover:bg-park-deep text-white px-6 py-3 rounded-[10px] font-bold transition-colors"
          >
            Sign in to rate
          </button>
        </div>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} next={next} />
      </>
    )
  }

  return (
    <>
      <RatingForm
        playgroundId={playgroundId}
        userId={userId}
        initialRating={initialRating}
        onSuccess={() => setSubmitted(true)}
        onNeedAuth={() => setShowAuth(true)}
      />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} next={next} />
    </>
  )
}
