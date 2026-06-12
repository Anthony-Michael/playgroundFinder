import type { Rating } from '@/lib/supabase/types'
import StarRating from './StarRating'

type Props = { ratings: Rating[] }

export default function ReviewList({ ratings }: Props) {
  if (ratings.length === 0) {
    return (
      <div className="border border-dashed border-line rounded-xl py-10 text-center px-4">
        <p className="font-semibold text-ink text-sm">No reviews yet</p>
        <p className="text-xs text-moss mt-1">Rate it to help the next parent out.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {ratings.map(r => (
        <div key={r.id} className="bg-white border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-park flex items-center justify-center font-data text-xs font-semibold text-white">
                {(r.users?.display_name ?? 'A')[0].toUpperCase()}
              </div>
              <span className="font-semibold text-sm text-ink">{r.users?.display_name ?? 'Anonymous'}</span>
            </div>
            <StarRating rating={r.stars} size="sm" />
          </div>
          {r.comment && <p className="text-ink/80 text-sm leading-relaxed">{r.comment}</p>}
          <p className="font-data text-[10px] font-semibold uppercase tracking-wider text-moss mt-2">
            {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      ))}
    </div>
  )
}
