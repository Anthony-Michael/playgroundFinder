import Link from 'next/link'
import type { Playground } from '@/lib/supabase/types'
import StarRating from './StarRating'
import { formatDistance } from '@/lib/distance'

type Props = {
  playground: Playground
  distanceKm?: number
}

export default function PlaygroundCard({ playground, distanceKm }: Props) {
  return (
    <Link href={`/playground/${playground.id}`} className="block border-b border-gray-100 py-4 hover:bg-gray-50 px-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{playground.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={Number(playground.avg_rating)} count={playground.rating_count} size="sm" />
          </div>
          {playground.city && <p className="text-gray-400 text-xs mt-1">{playground.city}</p>}
        </div>
        {distanceKm !== undefined && (
          <span className="text-sm text-gray-400 ml-3 flex-shrink-0">{formatDistance(distanceKm)}</span>
        )}
      </div>
    </Link>
  )
}
