'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AMENITIES, DEFAULT_AMENITIES } from '@/lib/amenities'
import type { Amenities } from '@/lib/supabase/types'
import StarPicker from './StarPicker'

type Props = {
  playgroundId: string
  userId: string
  onSuccess: () => void
  onNeedAuth: () => void
}

export default function RatingForm({ playgroundId, userId, onSuccess, onNeedAuth }: Props) {
  const [stars, setStars] = useState(0)
  const [amenities, setAmenities] = useState<Amenities>(DEFAULT_AMENITIES)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  function toggleAmenity(key: keyof Amenities) {
    setAmenities(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) { onNeedAuth(); return }
    if (stars === 0) { setError('Please select a star rating'); return }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.from('ratings').upsert({
      playground_id: playgroundId,
      user_id: userId,
      stars,
      amenities,
      comment: comment.trim() || null,
    } as any, { onConflict: 'playground_id,user_id' })

    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your rating</label>
        <StarPicker value={stars} onChange={setStars} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">What's there?</label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map(({ key, label, icon }) => (
            <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${amenities[key] ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
              <input
                type="checkbox"
                checked={amenities[key]}
                onChange={() => toggleAmenity(key)}
                className="sr-only"
              />
              <span>{icon}</span>
              <span className="text-sm">{label}</span>
              {amenities[key] && <span className="ml-auto">✓</span>}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Any tips for other parents?"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
        <p className="text-xs text-gray-400 text-right">{comment.length}/280</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-4 font-semibold disabled:opacity-50 text-base"
      >
        {loading ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  )
}
