import type { Rating } from '@/lib/supabase/types'
import StarRating from './StarRating'

type Props = { ratings: Rating[] }

export default function ReviewList({ ratings }: Props) {
  if (ratings.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="text-4xl mb-2">💬</div>
        <p className="font-medium text-gray-700 text-sm">No reviews yet</p>
        <p className="text-xs text-gray-400 mt-1">Be the first to rate this playground!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {ratings.map(r => (
        <div key={r.id} className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                {(r.users?.display_name ?? 'A')[0].toUpperCase()}
              </div>
              <span className="font-medium text-sm text-gray-800">{r.users?.display_name ?? 'Anonymous'}</span>
            </div>
            <StarRating rating={r.stars} size="sm" />
          </div>
          {r.comment && <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>}
          <p className="text-gray-400 text-xs mt-2">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
      ))}
    </div>
  )
}
