import Link from 'next/link'
import type { Playground } from '@/lib/supabase/types'
import StarRating from './StarRating'
import { formatDistance } from '@/lib/distance'

type Props = {
  playground: Playground
  distanceKm?: number
}

export default function PlaygroundCard({ playground, distanceKm }: Props) {
  const hasRatings = playground.rating_count > 0

  return (
    <Link
      href={`/playground/${playground.id}`}
      className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center text-xl">
        🛝
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
          {playground.name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          {hasRatings ? (
            <StarRating rating={Number(playground.avg_rating)} count={playground.rating_count} size="sm" />
          ) : (
            <span className="text-xs text-gray-400">No ratings yet</span>
          )}
          {playground.city && (
            <>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-400 truncate">{playground.city}</span>
            </>
          )}
        </div>
      </div>

      {distanceKm !== undefined && (
        <span className="text-sm text-gray-400 flex-shrink-0 font-medium">{formatDistance(distanceKm)}</span>
      )}
    </Link>
  )
}
