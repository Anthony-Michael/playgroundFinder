'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RatingForm from '@/components/RatingForm'
import AuthModal from '@/components/AuthModal'

type Props = { playgroundId: string; userId: string | null }

export default function RatingFormWrapper({ playgroundId, userId }: Props) {
  const [showAuth, setShowAuth] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-green-600">Thanks for your rating!</p>
        <button onClick={() => { setSubmitted(false); router.refresh() }} className="mt-3 text-sm text-gray-500 underline">
          Edit your rating
        </button>
      </div>
    )
  }

  if (!userId) {
    return (
      <>
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-gray-600 mb-4">Sign in to rate this playground</p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            Sign in to rate
          </button>
        </div>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </>
    )
  }

  return (
    <>
      <RatingForm
        playgroundId={playgroundId}
        userId={userId}
        onSuccess={() => setSubmitted(true)}
        onNeedAuth={() => setShowAuth(true)}
      />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
