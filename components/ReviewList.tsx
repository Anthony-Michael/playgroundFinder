import type { Rating } from '@/lib/supabase/types'
import StarRating from './StarRating'

type Props = { ratings: Rating[] }

export default function ReviewList({ ratings }: Props) {
  if (ratings.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">No reviews yet — be the first!</p>
  }
  return (
    <div className="space-y-3">
      {ratings.map(r => (
        <div key={r.id} className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{r.users?.display_name ?? 'Anonymous'}</span>
            <StarRating rating={r.stars} size="sm" />
          </div>
          {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
          <p className="text-gray-400 text-xs mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}
