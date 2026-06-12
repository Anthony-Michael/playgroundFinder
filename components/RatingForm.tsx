'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AMENITIES, DEFAULT_AMENITIES } from '@/lib/amenities'
import type { Amenities } from '@/lib/supabase/types'
import StarPicker from './StarPicker'
import AmenityIcon from './AmenityIcon'

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
    if (stars === 0) { setError('Select a star rating first'); return }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.from('ratings').upsert({
      playground_id: playgroundId,
      user_id: userId,
      stars,
      amenities,
      comment: comment.trim() || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as any, { onConflict: 'playground_id,user_id' })

    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-line rounded-xl p-4">
      <div>
        <label className="block text-sm font-semibold text-ink mb-2">Your rating</label>
        <StarPicker value={stars} onChange={setStars} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-2">What&apos;s there?</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AMENITIES.map(({ key, label }) => {
            const checked = amenities[key]
            return (
              <label
                key={key}
                className={`flex items-center gap-2.5 p-2.5 rounded-[10px] border cursor-pointer text-sm transition-colors ${
                  checked
                    ? 'bg-park border-park-deep text-white font-semibold'
                    : 'bg-sand border-line text-ink hover:border-park'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(key)}
                  className="sr-only"
                />
                <AmenityIcon name={key} className={`w-4 h-4 flex-shrink-0 ${checked ? 'text-slide' : 'text-park'}`} />
                <span className="truncate">{label}</span>
                {checked && <span className="ml-auto text-slide">✓</span>}
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-2">
          Comment <span className="text-moss font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Any tips for other parents?"
          className="w-full border border-line bg-sand rounded-[10px] px-3.5 py-3 text-sm focus:outline-2 focus:outline-park resize-none placeholder:text-moss"
        />
        <p className="font-data text-[10px] font-semibold text-moss text-right mt-1">{comment.length}/280</p>
      </div>

      {error && <p className="text-clay text-sm font-medium">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-park hover:bg-park-deep text-white rounded-[10px] py-3.5 font-bold disabled:opacity-50 text-base transition-colors"
      >
        {loading ? 'Submitting…' : 'Submit rating'}
      </button>
    </form>
  )
}
